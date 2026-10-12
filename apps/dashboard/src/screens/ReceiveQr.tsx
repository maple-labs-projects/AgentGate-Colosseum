import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { RECEIVE_ADDRESS } from "../modules/chain/base";

export function ReceiveQr({ onClose }: { onClose: () => void }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancel = false;
    QRCode.toDataURL(RECEIVE_ADDRESS, { margin: 1, width: 280, errorCorrectionLevel: "H" })
      .then((url) => {
        if (!cancel) setSrc(url);
      })
      .catch(() => {
        if (!cancel) setSrc("");
      });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="receive-modal" role="dialog" aria-label="Base address">
      <div className="receive-sheet">
        <header>
          <strong>Agent Gate / Base</strong>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="receive-qr">
          {src && <img src={src} alt="" />}
          <span className="chain-mark" aria-hidden="true" />
        </div>
        <h2>Base Address</h2>
        <p>Use this address to receive USDC and other tokens on Base</p>
        <p className="mono receive-full">{RECEIVE_ADDRESS}</p>
      </div>
    </div>
  );
}
