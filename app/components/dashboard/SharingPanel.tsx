import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Copy, Share2, UserPlus } from 'lucide-react';
import { getCurrentFirebaseUid } from '../../lib/firebaseAuth';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  ensureUserPublicIdIndexFromUserDoc,
  fetchOwnPublicId,
} from '../../lib/firestoreUsers';
import {
  linkFarmerToEngineerByPublicId,
  listEngineerLinksForFarmer,
  type FarmerEngineerLinkRow,
} from '../../lib/firestoreEngagements';
import { REPORTS_UPDATED_EVENT } from '../../lib/persistAnalyzerReport';
import {
  getStoredUserProfile,
  setStoredUserProfile,
  type UserRole,
} from '../../lib/session';

type Props = {
  role: UserRole;
};

export function SharingPanel({ role }: Props) {
  const [publicId, setPublicId] = useState('');
  const [copied, setCopied] = useState(false);
  const [engineerCode, setEngineerCode] = useState('');
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);
  const [links, setLinks] = useState<FarmerEngineerLinkRow[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);

  const refreshPublicIdAndLinks = useCallback(async () => {
    const p = getStoredUserProfile();
    if (!p?.uid) return;
    let pid = p.publicId || '';
    if (!pid && isFirebaseConfigured()) {
      const fromFs = await fetchOwnPublicId(p.uid);
      if (fromFs) {
        pid = fromFs;
        setStoredUserProfile({ ...p, publicId: fromFs });
      }
    }
    if (pid && isFirebaseConfigured()) {
      void ensureUserPublicIdIndexFromUserDoc(p.uid);
    }
    setPublicId(pid);

    if (role === 'ciftci') {
      const rows = await listEngineerLinksForFarmer(p.uid);
      setLinks(rows);
    }
  }, [role]);

  useEffect(() => {
    void refreshPublicIdAndLinks();
  }, [refreshPublicIdAndLinks]);

  const copyId = async () => {
    if (!publicId) return;
    try {
      await navigator.clipboard.writeText(publicId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLinkErr(null);
    setLinkOk(false);
    const p = getStoredUserProfile();
    if (!p?.uid) {
      setLinkErr('Oturum bulunamadı.');
      return;
    }
    const fb = getCurrentFirebaseUid();
    if (fb !== p.uid) {
      setLinkErr('Paylaşım için Firebase oturumunun açık olması gerekir. Sayfayı yenileyip tekrar deneyin.');
      return;
    }
    setLinkBusy(true);
    try {
      const result = await linkFarmerToEngineerByPublicId(p.uid, role, engineerCode);
      if (!result.ok) {
        setLinkErr(result.message);
        return;
      }
      setLinkOk(true);
      setEngineerCode('');
      await refreshPublicIdAndLinks();
      window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
    } finally {
      setLinkBusy(false);
    }
  };

  const isFarmer = role === 'ciftci';

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="w-8 h-8 text-green-600" />
          Paylaşım
        </h1>
        <p className="text-gray-600 mt-1">
          Her hesabın kalıcı bir paylaşım kodu vardır. Çiftçiler, raporlarını görmesini istedikleri mühendisin
          kodunu girerek paylaşım kurar.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Paylaşım kodunuz</h2>
        <p className="text-sm text-gray-600">
          Bu kodu güvenilir kişilerle paylaşın.{!isFarmer && ' Çiftçiler bu kodu kullanarak size rapor erişimi verebilir.'}
          {isFarmer && ' Mühendisinizin kodunu aşağıya yazarak onun raporlarınızı görmesini sağlayabilirsiniz.'}
        </p>
        {publicId ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="text-lg font-mono font-semibold tracking-wide bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              {publicId}
            </code>
            <button
              type="button"
              onClick={() => void copyId()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopyala
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Paylaşım kodu yüklenemedi. Firebase ile giriş yaptığınızdan emin olun; gerekirse bir kez çıkış yapıp tekrar
            girin (profil kaydı oluşur).
          </p>
        )}
      </div>

      {isFarmer && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            Mühendisle paylaşım
          </h2>
          <p className="text-sm text-gray-600">
            Mühendisinizin paylaşım kodunu (ONG-…) girin. Bağlantı kurulunca Analyzer raporlarınız mühendisin Çiftçi
            Raporları ve Sinyal Ölçümleri ekranlarında görünür.
          </p>
          <form onSubmit={(e) => void handleLinkSubmit(e)} className="space-y-3">
            <label htmlFor="engineer-public-id" className="text-sm font-medium text-gray-700 block">
              Mühendis paylaşım kodu
            </label>
            <input
              id="engineer-public-id"
              type="text"
              autoComplete="off"
              value={engineerCode}
              onChange={(e) => setEngineerCode(e.target.value)}
              placeholder="Örn. ONG-ABC12DEF"
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent font-mono"
            />
            {linkErr && <p className="text-sm text-red-600">{linkErr}</p>}
            {linkOk && <p className="text-sm text-green-700">Bağlantı kuruldu veya zaten geçerliydi.</p>}
            <button
              type="submit"
              disabled={linkBusy || !engineerCode.trim()}
              className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {linkBusy ? 'Bağlanıyor…' : 'Paylaşımı bağla'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Bağlı mühendisler</h3>
            {links.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz mühendis kodu ile bağlantı yok.</p>
            ) : (
              <ul className="space-y-2">
                {links.map((row) => (
                  <li
                    key={row.engineerUid}
                    className="text-sm flex flex-wrap gap-x-3 gap-y-1 items-baseline border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">
                      {row.engineerLabel || row.engineerPublicId || row.engineerUid}
                    </span>
                    {row.engineerPublicId && (
                      <code className="text-xs text-gray-600 font-mono">{row.engineerPublicId}</code>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
