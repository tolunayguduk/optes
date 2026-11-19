// Yüz parmak izi modelini (MobileFaceNet) indirir. Model, lisansı/eğitim verisi doğrulanmadığı için
// repoya KONMAZ (.gitignore). Her ortamda (yerel, CI) bu betikle indirilir.
//
// Kullanım: npm run models:face
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL =
  'https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/mobile_facenet/releases/v0.67.0/mobile_facenet-tflite-float.zip';
const TARGET = 'assets/models/mobilefacenet.tflite';
// İndirilen mobile_facenet.tflite dosyasının SHA-256 değeri (2026-11-20'de doğrulandı).
const SHA256 = '153e303d70dcefa0b5052c0a1719dde417eb6f48020cd13f5bdc6e39c48c59f7';

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

if (existsSync(TARGET) && sha(readFileSync(TARGET)) === SHA256) {
  console.log(`${TARGET} zaten var ve doğru.`);
  process.exit(0);
}

const work = mkdtempSync(join(tmpdir(), 'optes-face-'));
try {
  console.log('MobileFaceNet indiriliyor...');
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`İndirme başarısız: HTTP ${res.status}`);
  const zipPath = join(work, 'model.zip');
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));

  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${work}' -Force`],
      { stdio: 'inherit' },
    );
  } else {
    execFileSync('unzip', ['-o', '-q', zipPath, '-d', work], { stdio: 'inherit' });
  }

  const extracted = join(work, 'mobile_facenet-tflite-float', 'mobile_facenet.tflite');
  const actual = sha(readFileSync(extracted));
  if (actual !== SHA256) {
    throw new Error(`SHA-256 uyuşmuyor (beklenen ${SHA256}, gelen ${actual}). Model değişmiş olabilir; doğrulayıp betiği güncelle.`);
  }
  mkdirSync('assets/models', { recursive: true });
  copyFileSync(extracted, TARGET);
  console.log(`Hazır: ${TARGET}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
