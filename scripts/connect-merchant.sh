#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  WePay — Connect BharatPe Merchant to Production
# ═══════════════════════════════════════════════════════════════
#
#  USAGE:
#    bash connect-merchant.sh
#
#  This script will ask you to paste the extracted credentials
#  from the browser script and connect them to your WePay account.
# ═══════════════════════════════════════════════════════════════

VPS="root@187.127.153.28"
API_URL="http://187.127.153.28"

echo "═══════════════════════════════════════════"
echo "  WePay — Connect BharatPe Merchant"
echo "═══════════════════════════════════════════"
echo ""
echo "Paste the values from the browser extraction script:"
echo ""

read -p "Cookie (full string): " COOKIE
echo ""
read -p "Token: " TOKEN
echo ""
read -p "Merchant ID: " MERCHANT_ID
echo ""
read -p "UPI ID (e.g. xxx@bharatpe): " UPI_ID
echo ""
read -p "Mobile number: " MOBILE
echo ""

if [ -z "$COOKIE" ] || [ -z "$UPI_ID" ] || [ -z "$MOBILE" ]; then
  echo "❌ Cookie, UPI ID, and Mobile are required!"
  exit 1
fi

echo ""
echo "Connecting merchant to WePay..."
echo ""

# SSH into VPS and insert merchant with encrypted credentials
ssh -o ConnectTimeout=10 $VPS "cd /var/www/wepay && node -e \"
const { PrismaClient } = require('./node_modules/@prisma/client');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
function getKey() {
  const key = process.env.ENCRYPTION_KEY || '2905d7905e6e36e5831b4de8dc67aaaa';
  return crypto.createHash('sha256').update(key).digest();
}
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

const prisma = new PrismaClient();

async function main() {
  // Check if merchant already exists
  const existing = await prisma.merchant.findFirst({
    where: { userId: 1, mobile: '$MOBILE' },
  });

  if (existing) {
    // Update existing
    await prisma.merchant.update({
      where: { id: existing.id },
      data: {
        cookie: encrypt('$(echo "$COOKIE" | sed "s/'/\\\\'/g")'),
        token: encrypt('$(echo "$TOKEN" | sed "s/'/\\\\'/g")'),
        merchantId: '$MERCHANT_ID',
        upiId: '$UPI_ID',
        verified: true,
        status: 'active',
        lastCookieRefresh: new Date(),
      },
    });
    console.log('✅ Merchant updated with new credentials');
  } else {
    // Create new
    await prisma.merchant.create({
      data: {
        userId: 1,
        type: 'BHARATPE',
        mobile: '$MOBILE',
        merchantId: '$MERCHANT_ID',
        upiId: '$UPI_ID',
        cookie: encrypt('$(echo "$COOKIE" | sed "s/'/\\\\'/g")'),
        token: encrypt('$(echo "$TOKEN" | sed "s/'/\\\\'/g")'),
        mcc: '5411',
        orgid: '159002',
        status: 'active',
        verified: true,
        lastCookieRefresh: new Date(),
      },
    });
    console.log('✅ New merchant created');
  }

  // Disable sandbox mode since we now have real credentials
  await prisma.user.update({
    where: { id: 1 },
    data: { sandboxMode: false },
  });
  console.log('✅ Sandbox mode DISABLED — live payments enabled');

  const merchant = await prisma.merchant.findFirst({
    where: { userId: 1, mobile: '$MOBILE' },
    select: { id: true, upiId: true, status: true, verified: true },
  });
  console.log('Merchant:', JSON.stringify(merchant));
}

main().catch(console.error).finally(() => prisma.\\\$disconnect());
\""

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ DONE! Live payments are now enabled."
echo "═══════════════════════════════════════════"
echo ""
echo "Test with:"
echo "  curl -X POST '$API_URL/api/create-order' \\"
echo "    -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "    -d 'customer_mobile=9876543210&user_token=1b8bf7f304b4cb8b186ff285b98ad63c&amount=1'"
