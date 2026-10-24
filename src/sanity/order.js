const orderSchema = {
  name: 'order',
  title: 'Paid order',
  type: 'document',
  fields: [
    { name: 'stripeSessionId', title: 'Stripe Checkout Session ID', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'paymentIntentId', title: 'Stripe Payment Intent ID', type: 'string' },
    { name: 'customerEmail', title: 'Customer email', type: 'string' },
    {
      name: 'status',
      title: 'Payment status',
      type: 'string',
      options: { list: [{ title: 'Paid', value: 'paid' }] },
      validation: (Rule) => Rule.required(),
    },
    { name: 'totalAmount', title: 'Total amount (minor currency units)', type: 'number', validation: (Rule) => Rule.required().min(0) },
    { name: 'currency', title: 'Currency', type: 'string', validation: (Rule) => Rule.required().length(3) },
    { name: 'createdAt', title: 'Paid event received at', type: 'datetime', validation: (Rule) => Rule.required() },
    {
      name: 'lineItems',
      title: 'Line items',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: 'Product name', type: 'string', validation: (Rule) => Rule.required() },
          { name: 'quantity', title: 'Quantity', type: 'number', validation: (Rule) => Rule.required().integer().min(1) },
          { name: 'amountTotal', title: 'Line total (minor currency units)', type: 'number', validation: (Rule) => Rule.required().min(0) },
          { name: 'currency', title: 'Currency', type: 'string', validation: (Rule) => Rule.required().length(3) },
        ],
      }],
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'shippingAddress',
      title: 'Shipping address',
      type: 'object',
      fields: [
        { name: 'name', title: 'Recipient', type: 'string' },
        { name: 'line1', title: 'Address line 1', type: 'string' },
        { name: 'line2', title: 'Address line 2', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'state', title: 'State / region', type: 'string' },
        { name: 'postalCode', title: 'Postal code', type: 'string' },
        { name: 'country', title: 'Country code', type: 'string' },
      ],
    },
  ],
};

export default orderSchema;
