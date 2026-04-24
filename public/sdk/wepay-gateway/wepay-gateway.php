<?php
/**
 * Plugin Name: WePay UPI Gateway
 * Plugin URI: https://pay.aadityaswhatsapp.fun
 * Description: Accept UPI payments via WePay payment gateway for WooCommerce
 * Version: 1.0.0
 * Author: WePay
 * License: GPL-2.0+
 * Requires Plugins: woocommerce
 */

if (!defined('ABSPATH')) exit;

add_action('plugins_loaded', 'wepay_gateway_init', 0);

function wepay_gateway_init() {
    if (!class_exists('WC_Payment_Gateway')) return;

    class WC_Gateway_WePay extends WC_Payment_Gateway {

        public function __construct() {
            $this->id                 = 'wepay_upi';
            $this->method_title       = 'WePay UPI';
            $this->method_description = 'Accept UPI payments via WePay gateway. Customers pay using any UPI app (GPay, PhonePe, Paytm, etc.)';
            $this->has_fields         = false;
            $this->icon               = '';

            $this->init_form_fields();
            $this->init_settings();

            $this->title       = $this->get_option('title');
            $this->description = $this->get_option('description');
            $this->api_url     = rtrim($this->get_option('api_url'), '/');
            $this->api_token   = $this->get_option('api_token');
            $this->enabled     = $this->get_option('enabled');

            // Save settings
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));

            // Callback handler
            add_action('woocommerce_api_wepay_callback', array($this, 'handle_callback'));
        }

        public function init_form_fields() {
            $this->form_fields = array(
                'enabled' => array(
                    'title'   => 'Enable/Disable',
                    'type'    => 'checkbox',
                    'label'   => 'Enable WePay UPI Payment',
                    'default' => 'no',
                ),
                'title' => array(
                    'title'       => 'Title',
                    'type'        => 'text',
                    'description' => 'Payment method title shown at checkout',
                    'default'     => 'UPI Payment (GPay, PhonePe, Paytm)',
                    'desc_tip'    => true,
                ),
                'description' => array(
                    'title'       => 'Description',
                    'type'        => 'textarea',
                    'description' => 'Payment method description shown at checkout',
                    'default'     => 'Pay securely using any UPI app. Instant confirmation.',
                ),
                'api_url' => array(
                    'title'       => 'WePay API URL',
                    'type'        => 'text',
                    'description' => 'Your WePay portal URL (e.g., https://pay.aadityaswhatsapp.fun)',
                    'default'     => 'https://pay.aadityaswhatsapp.fun',
                    'desc_tip'    => true,
                ),
                'api_token' => array(
                    'title'       => 'API Token',
                    'type'        => 'password',
                    'description' => 'Your WePay API token. Find it in Dashboard → API Details.',
                    'default'     => '',
                    'desc_tip'    => true,
                ),
            );
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);

            $payload = array(
                'customer_mobile' => $order->get_billing_phone(),
                'user_token'      => $this->api_token,
                'amount'          => $order->get_total(),
                'order_id'        => 'WC-' . $order_id . '-' . time(),
                'redirect_url'    => $this->get_return_url($order),
                'remark1'         => 'WooCommerce Order #' . $order_id,
                'remark2'         => $order->get_billing_email(),
            );

            $response = wp_remote_post($this->api_url . '/api/create-order', array(
                'body'    => json_encode($payload),
                'headers' => array('Content-Type' => 'application/json'),
                'timeout' => 30,
            ));

            if (is_wp_error($response)) {
                wc_add_notice('Payment gateway error: ' . $response->get_error_message(), 'error');
                return array('result' => 'fail');
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);

            if (!empty($body['status']) && !empty($body['result']['payment_url'])) {
                // Store WePay order ID for status checking
                $order->update_meta_data('_wepay_order_id', $body['result']['orderId']);
                $order->save();

                // Mark as pending payment
                $order->update_status('pending', 'Awaiting WePay UPI payment.');

                // Reduce stock
                wc_reduce_stock_levels($order_id);

                // Empty cart
                WC()->cart->empty_cart();

                return array(
                    'result'   => 'success',
                    'redirect' => $body['result']['payment_url'],
                );
            }

            $error_msg = !empty($body['message']) ? $body['message'] : 'Unknown error creating payment';
            wc_add_notice('Payment error: ' . $error_msg, 'error');
            return array('result' => 'fail');
        }

        /**
         * Handle payment callback/webhook from WePay
         * URL: /wc-api/wepay_callback/?order_id=XX&status=SUCCESS&utr=XXX
         */
        public function handle_callback() {
            $order_id = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;
            $status   = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
            $utr      = isset($_GET['utr']) ? sanitize_text_field($_GET['utr']) : '';

            if (!$order_id) {
                wp_die('Invalid callback', 'WePay Error', array('response' => 400));
            }

            $order = wc_get_order($order_id);
            if (!$order) {
                wp_die('Order not found', 'WePay Error', array('response' => 404));
            }

            if ($status === 'SUCCESS') {
                $order->payment_complete($utr);
                $order->add_order_note('WePay UPI payment successful. UTR: ' . $utr);
            } elseif ($status === 'FAILED') {
                $order->update_status('failed', 'WePay UPI payment failed.');
            }

            wp_redirect($this->get_return_url($order));
            exit;
        }
    }
}

// Register the gateway
add_filter('woocommerce_payment_gateways', 'wepay_add_gateway');
function wepay_add_gateway($gateways) {
    $gateways[] = 'WC_Gateway_WePay';
    return $gateways;
}
