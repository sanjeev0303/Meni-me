import { renderInvoicePdf } from './src/server/invoice-service';
import type { InvoicePayload } from './src/server/invoice-service';

const payload: InvoicePayload = {
  orderId: 'test-order',
  orderNumber: 'ORD-TEST-123',
  currency: 'USD',
  subtotal: 100,
  shippingFee: 10,
  tax: 5,
  total: 115,
  placedAt: new Date(),
  fulfilledAt: new Date(),
  customerId: 'user_123',
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  shippingAddress: { fullName: 'Test User', streetLine1: '123 Fashion Ave', city: 'Paris', state: 'Île-de-France', postalCode: '75001', country: 'France' },
  billingAddress: null,
  items: [
    {
      id: 'item-1',
      productName: 'Silk Dress',
      productSku: 'SKU-001',
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
      selectedSize: 'M',
      selectedColor: 'Ruby'
    }
  ]
};

(async () => {
  const buffer = await renderInvoicePdf(payload);
  console.log('PDF bytes', buffer.length);
})();
