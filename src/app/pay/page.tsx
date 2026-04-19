import { prisma } from '@/lib/db';
import { decodePaymentData, verifyPaymentData, generateUpiUris, getAppIntents, generateQrDataUrl, detectPlatform } from '@/lib/upi';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import PaymentPageClient from './PaymentPageClient';

interface PaymentPageProps {
  searchParams: Promise<{ data?: string }>;
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const resolvedParams = await searchParams;
  const data = resolvedParams.data;

  if (!data) return notFound();

  // Verify HMAC signature
  if (!verifyPaymentData(data)) return notFound();

  const paymentInfo = decodePaymentData(data);
  if (!paymentInfo) return notFound();

  const orderId = paymentInfo.oid as string;
  const userId = paymentInfo.uid as number;

  // Get transaction
  const transaction = await prisma.transaction.findFirst({
    where: { orderId, userId },
    include: {
      merchant: true,
      user: { select: { name: true, sandboxMode: true } },
    },
  });

  if (!transaction) return notFound();

  // Track page open
  if (!transaction.paymentPageOpened) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paymentPageOpened: true, paymentPageOpenedAt: new Date() },
    });
  }

  // Generate UPI data
  let qrDataUrl = '';
  let appIntents = { paytm: '', fallback: '' };

  if (transaction.merchant?.upiId) {
    const upiParams = {
      upiId: transaction.merchant.upiId,
      payeeName: transaction.user?.name || 'WePay',
      amount: transaction.amount,
      transactionNote: transaction.remark1 || `Payment ${transaction.orderId}`,
      orderId: transaction.orderId,
      mc: transaction.merchant.mcc || '5641',
      sign: transaction.merchant.sign || null,
      orgid: transaction.merchant.orgid || '159002',
    };

    const { qrUri, intentUri, paytmUri } = generateUpiUris(upiParams);
    qrDataUrl = await generateQrDataUrl(qrUri);
    appIntents = getAppIntents(intentUri, paytmUri);
  }

  // Detect platform
  const headerStore = await headers();
  const userAgent = headerStore.get('user-agent');
  const platform = detectPlatform(userAgent);

  // Calculate expiry
  const expiresAt = transaction.expiresAt
    ? new Date(transaction.expiresAt).getTime()
    : Date.now() + 10 * 60 * 1000;
  const expirySeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

  return (
    <PaymentPageClient
      amount={transaction.amount}
      orderId={transaction.orderId}
      merchantName={transaction.user?.name || 'Merchant'}
      remark={transaction.remark1 || ''}
      redirectUrl={transaction.redirectUrl || ''}
      qrDataUrl={qrDataUrl}
      paytmUri={appIntents.paytm}
      fallbackUri={appIntents.fallback}
      expirySeconds={expirySeconds}
      isSandbox={!!(transaction.sandbox || transaction.user?.sandboxMode)}
      platform={platform}
      status={transaction.status}
    />
  );
}
