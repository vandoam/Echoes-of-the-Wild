/**
 * Echoes of the Wild - Android Native Project & APK Build Guide Modal
 */
import React, { useState } from 'react';
import { X, Smartphone, Download, Terminal, CheckCircle2, Copy } from 'lucide-react';

interface AndroidExportModalProps {
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const capacitorConfig = {
    appId: 'com.echoesofthewild.survival',
    appName: 'Echoes of the Wild',
    webDir: 'dist',
    bundledWebRuntime: false,
    android: {
      allowMixedContent: false,
      backgroundColor: '#0b100d',
    },
  };

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.echoesofthewild.survival">

    <uses-feature android:name="android.hardware.touchscreen" android:required="true" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:screenOrientation="sensorLandscape"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-neutral-900/95 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-emerald-300">
                Guia de Compilação Android (APK Nativo)
              </h2>
              <p className="text-xs text-neutral-400">
                Projeto estruturado para empacotamento nativo Android com Capacitor / Gradle em modo paisagem.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 mt-4 overflow-y-auto pr-1 text-xs">
          {/* Quick steps */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col gap-2.5">
            <span className="font-bold text-neutral-200 text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> Como gerar o APK no Android Studio ou terminal:
            </span>

            <div className="bg-neutral-900 p-3 rounded-xl font-mono text-[11px] text-emerald-300 space-y-1 border border-white/5">
              <p># 1. Compilar a versão otimizada do jogo:</p>
              <p className="text-white font-bold">npm run build</p>
              <p className="pt-1"># 2. Inicializar o wrapper Capacitor Android:</p>
              <p className="text-white font-bold">npx cap add android</p>
              <p className="text-white font-bold">npx cap copy</p>
              <p className="pt-1"># 3. Gerar o APK com Gradle ou abrir no Android Studio:</p>
              <p className="text-white font-bold">cd android && ./gradlew assembleDebug</p>
              <p className="text-neutral-400"># O arquivo APK estará em: android/app/build/outputs/apk/debug/app-debug.apk</p>
            </div>
          </div>

          {/* Files to download */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* capacitor.config.json */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white block">capacitor.config.json</span>
                <span className="text-[11px] text-neutral-400">Configuração do identificador Android e modo paisagem</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => downloadFile('capacitor.config.json', JSON.stringify(capacitorConfig, null, 2))}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Config
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(capacitorConfig, null, 2), 1)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  {copiedIndex === 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AndroidManifest.xml */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col justify-between">
              <div>
                <span className="font-bold text-white block">AndroidManifest.xml</span>
                <span className="text-[11px] text-neutral-400">sensorLandscape, aceleração por hardware e touch</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => downloadFile('AndroidManifest.xml', androidManifest)}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Manifest
                </button>
                <button
                  onClick={() => copyToClipboard(androidManifest, 2)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  {copiedIndex === 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Features note */}
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
            <span className="font-bold block mb-1">✓ Pronto para Celulares Android</span>
            O jogo possui joystick virtual na ponta esquerda, rotação de câmera sensível ao toque na direita, botões de ação ergonômicos, persistência 100% offline via LocalStorage e renderização acelerada por WebGL2 adaptada para aparelhos intermediários.
          </div>
        </div>
      </div>
    </div>
  );
};
