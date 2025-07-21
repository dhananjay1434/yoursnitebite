import React from 'react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

// Safe price formatting function to prevent toFixed errors
const formatPrice = (price: number | undefined | null): string => {
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  return safePrice.toFixed(2);
};

interface QrPaymentProps {
  upiPaymentUrl: string;
  totalAmount: number;
}

const QrPayment: React.FC<QrPaymentProps> = ({ upiPaymentUrl, totalAmount }) => {
  const openUpiApp = () => {
    window.location.href = upiPaymentUrl;
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-medium text-nitebite-highlight mb-4">
        UPI Payment
      </h2>
      <QRCodeSVG value={upiPaymentUrl} size={200} />
      <p className="text-center text-nitebite-text mt-4">
        Scan this QR code with your UPI app to pay&nbsp;
        <span className="font-bold text-nitebite-highlight">
          ₹{formatPrice(totalAmount)}
        </span>
      </p>
      <button
        onClick={openUpiApp}
        className="mt-6 flex items-center gap-2 border border-transparent hover:border-nitebite-highlight rounded-lg p-2 focus:outline-none"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
          alt="UPI Icon"
          className="w-8 h-8"
        />
        <span className="text-nitebite-highlight font-medium">Open UPI App</span>
      </button>
    </div>
  );
};

const CodPayment: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-medium text-nitebite-highlight mb-4">
        Cash on Delivery (COD)
      </h2>
      <p className="text-center text-nitebite-text mt-4">
        You have selected Cash on Delivery. Please prepare the exact amount for payment on delivery.
      </p>
    </div>
  );
};

interface PaymentOptionsProps {
  selectedMethod: 'qr' | 'cod';
  onMethodChange: (method: 'qr' | 'cod') => void;
  totalAmount: number;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  selectedMethod,
  onMethodChange,
  totalAmount,
}) => {

  const upiPaymentInfo = {
    pa: 'rajdeep.kumar@fam',
    pn: 'Nitebite',
    tn: 'Order Payment',
    am: formatPrice(totalAmount),
  };

  const upiPaymentUrl = `upi://pay?pa=${upiPaymentInfo.pa}&pn=${encodeURIComponent(
    upiPaymentInfo.pn
  )}&tn=${encodeURIComponent(upiPaymentInfo.tn)}&am=${upiPaymentInfo.am}`;

  return (
    <div className="glassmorphic-card p-4 md:p-6 rounded-2xl mb-8">
      <div className="flex justify-center mb-6 gap-4">
        <Button
          variant={selectedMethod === 'qr' ? 'default' : 'outline'}
          onClick={() => onMethodChange('qr')}
        >
          UPI QR Payment
        </Button>
        <Button
          variant={selectedMethod === 'cod' ? 'default' : 'outline'}
          onClick={() => onMethodChange('cod')}
        >
          Cash on Delivery
        </Button>
      </div>
      {selectedMethod === 'qr' ? (
        <QrPayment upiPaymentUrl={upiPaymentUrl} totalAmount={totalAmount} />
      ) : (
        <CodPayment />
      )}
    </div>
  );
};

export default PaymentOptions;