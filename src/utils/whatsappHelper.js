import { formatDate } from './dateFormatter';

export const openWhatsAppDueReminder = ({ member, gymName, ownerPhone }) => {
  if (!member || !member.phone) {
    alert('Member phone number is missing.');
    return;
  }

  // Sanitize phone number (remove spaces, symbols)
  let cleanPhone = member.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India (+91)
  }

  const facility = gymName || 'Pulse Fit Hub';
  const total = Number(member.total_amount || member.amount_paid).toLocaleString('en-IN');
  const paid = Number(member.amount_paid).toLocaleString('en-IN');
  const due = Number(member.balance_due || 0).toLocaleString('en-IN');
  const expiry = formatDate(member.expiry_date);

  const message = 
`⚡ *${facility.toUpperCase()} - FEE PAYMENT REMINDER* ⚡

Dear *${member.full_name}*,

This is a friendly reminder regarding your membership fee dues at *${facility}*.

📋 *Membership Summary:*
• *Plan Duration:* ${member.plan_type}
• *Total Fee:* ₹${total}
• *Amount Paid:* ₹${paid}
• *Outstanding Due:* *₹${due}* ⚠️
• *Pass Expiry Date:* ${expiry}

Kindly settle your pending due amount of *₹${due}* at the gym reception desk or via UPI to ensure your access pass remains active.

📞 *Front Desk Contact:* ${ownerPhone || 'Gym Front Desk'}
_Thank you for training with us!_`;

  const encodedMsg = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;

  window.open(whatsappUrl, '_blank');
};