import React from 'react';
import { IssuerProfile } from '../domain/storage';

interface Props {
  issuer: IssuerProfile;
  issueDate?: string;
  roleTitle?: string;
  isRecipient?: boolean;
}

export const SignatureBlock: React.FC<Props> = ({
  issuer,
  issueDate,
  roleTitle = 'ผู้วางบิล / ผู้รับเงิน',
  isRecipient = false
}) => {
  if (isRecipient) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="h-9 flex items-end justify-center">
          {/* Spacer */}
        </div>
        <div className="border-b border-slate-400 w-36 sm:w-44 mx-auto mt-0.5"></div>
        <div className="mt-1 font-medium text-slate-700 text-[11px]">(...........................................................)</div>
        <div className="text-slate-500 text-[10px] mt-0.5">ผู้รับวางบิล / วันที่</div>
      </div>
    );
  }

  const mode = issuer.signatureMode || 'auto';

  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-9 flex flex-col items-center justify-center">
        {mode === 'drawn' && issuer.signatureDataUrl ? (
          <img
            src={issuer.signatureDataUrl}
            alt="ลายมือชื่อดิจิทัล"
            className="max-h-9 max-w-[140px] object-contain drop-shadow-2xs"
          />
        ) : mode === 'auto' ? (
          <div className="flex flex-col items-center justify-center">
            <span className="font-['Mali','Caveat',cursive] italic font-semibold text-lg text-indigo-950 tracking-wide select-none leading-none transform -rotate-1">
              {issuer.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.2 rounded-full mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ลงนามอิเล็กทรอนิกส์ {issueDate ? `(${issueDate})` : ''}
            </span>
          </div>
        ) : (
          <div className="w-full h-full"></div>
        )}
      </div>

      <div className="border-b border-slate-400 w-36 sm:w-44 mx-auto mt-0.5"></div>
      <div className="mt-1 font-medium text-slate-800 text-[11px]">({issuer.name})</div>
      <div className="text-slate-500 text-[10px] mt-0.5">{roleTitle}</div>
    </div>
  );
};
