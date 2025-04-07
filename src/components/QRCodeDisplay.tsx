
import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
}

const QRCodeDisplay = ({ 
  value, 
  size = 128, 
  includeMargin = true 
}: QRCodeDisplayProps) => {
  return (
    <Card className="p-4 flex items-center justify-center bg-white">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"L"}
        includeMargin={includeMargin}
      />
    </Card>
  );
};

export default QRCodeDisplay;
