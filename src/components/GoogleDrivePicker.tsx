import React, { useEffect, useState } from 'react';
import { googleAccessToken, setGoogleAccessToken } from '../AdminPanel';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleDrivePickerProps {
  onPick: (file: { id: string, name: string, url: string }) => void;
  onPickMultiple?: (files: { id: string, name: string, url: string }[]) => void;
  multiple?: boolean;
}

export default function GoogleDrivePicker({ onPick, onPickMultiple, multiple = false }: GoogleDrivePickerProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.gapi) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  const handleOpenPicker = async () => {
    let token = googleAccessToken;
    if (!token) {
      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.readonly');
        provider.addScope('https://www.googleapis.com/auth/calendar');
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setGoogleAccessToken(token);
        } else {
          throw new Error("No access token found");
        }
      } catch (error) {
        alert("Failed to get Google Drive access token. Please try again.");
        return;
      }
    }
    if (!window.gapi) return;

    window.gapi.load('picker', {
      callback: () => {
        const pickerOrigin = window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

        const docsView = new window.google.picker.DocsView()
          .setIncludeFolders(true)
          .setMimeTypes('image/png,image/jpeg,image/jpg,image/webp');

        const builder = new window.google.picker.PickerBuilder()
          .addView(docsView)
          .setOAuthToken(token)
          .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const files = data.docs.map((file: any) => {
                const directUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`;
                return { id: file.id, name: file.name, url: directUrl };
              });
              
              if (multiple && onPickMultiple) {
                onPickMultiple(files);
              } else if (files.length > 0) {
                onPick(files[0]);
              }
            }
          })
          .setOrigin(pickerOrigin);

        if (multiple) {
          builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
        }

        const picker = builder.build();
        picker.setVisible(true);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleOpenPicker}
      disabled={!isScriptLoaded}
      className="px-3 py-2 bg-[#4285F4] text-white text-[10px] font-mono uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
    >
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3 h-3">
        <path fill="#FFC107" d="M17 6h14l11 19H28z" />
        <path fill="#1976D2" d="M28 44H6l11-19h22z" />
        <path fill="#4CAF50" d="M39 25L28 6 17 25h22z" />
      </svg>
      Import from Drive
    </button>
  );
}
