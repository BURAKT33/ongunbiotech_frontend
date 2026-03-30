import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Copy, Share2, UserPlus } from 'lucide-react';
import { getCurrentFirebaseUid, refreshAuthTokenForFirestore } from '../../lib/firebaseAuth';
import {
  createFarmerEngineerLink,
  listEngineerLinksForFarmer,
  listFarmerLinksForEngineer,
  type EngineerFarmerLinkRow,
  type FarmerEngineerLinkRow,
} from '../../lib/firestoreEngagements';
import { REPORTS_UPDATED_EVENT } from '../../lib/persistAnalyzerReport';
import {
  getStoredUserProfile,
  type UserRole,
} from '../../lib/session';

type Props = {
  role: UserRole;
};

export function SharingPanel({ role }: Props) {
  const [myUid, setMyUid] = useState('');
  const [copied, setCopied] = useState(false);
  const [engineerUidInput, setEngineerUidInput] = useState('');
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);
  const [links, setLinks] = useState<FarmerEngineerLinkRow[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [farmerLinks, setFarmerLinks] = useState<EngineerFarmerLinkRow[]>([]);

  const refreshLinks = useCallback(async () => {
    const p = getStoredUserProfile();
    if (!p?.uid) return;
    if (role === 'ciftci') {
      const rows = await listEngineerLinksForFarmer(p.uid);
      setLinks(rows);
      setFarmerLinks([]);
      return;
    }

    const f = await listFarmerLinksForEngineer(p.uid);
    setFarmerLinks(f);
  }, [role]);

  useEffect(() => {
    void refreshLinks();
  }, [refreshLinks]);

  useEffect(() => {
    const p = getStoredUserProfile();
    setMyUid(p?.uid ?? '');
  }, []);

  const copyMyUid = async () => {
    if (!myUid) return;
    try {
      await navigator.clipboard.writeText(myUid);
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
    const engineerUid = engineerUidInput.trim();
    if (!engineerUid) {
      setLinkErr('Mühendis Firebase uid girin.');
      return;
    }
    if (engineerUid === p.uid) {
      setLinkErr('Kendi uid’nizi girdiniz; mühendisin uid’sini girin.');
      return;
    }
    setLinkBusy(true);
    try {
      await refreshAuthTokenForFirestore();
      await createFarmerEngineerLink(engineerUid, p.uid, {
        farmerDisplayName: p.displayName?.trim() || undefined,
        farmerEmail: p.email?.trim() || undefined,
      });
      setLinkOk(true);
      setEngineerUidInput('');
      await refreshLinks();
      window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code === 'permission-denied') {
        setLinkErr(
          'Firestore izni reddedildi. Firebase Console’da güncel firestore.rules dosyanızı yayınlayın (çiftçi, farmerUid == kendi uid’si iken engagements oluşturabilmeli). Mühendis uid’sinin Auth’taki değerle birebir aynı olduğundan emin olun.',
        );
      } else if (err instanceof Error && err.message) {
        setLinkErr(err.message);
      } else {
        setLinkErr('Bağlantı kurulamadı. Biraz sonra tekrar deneyin.');
      }
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
          Çiftçi, paylaşmak istediği mühendisin Firebase uid’sini girer; sistem bu uid ile bir çiftçi–mühendis bağlantısı
          kurar. Mühendis panelinde <strong>Paylaşım → Bağlı çiftçiler</strong> ve <strong>Çiftçi Raporları</strong> bu
          bağlantıya göre dolar; ilgili çiftçinin tüm Firestore raporları okunabilir olur.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Firebase uid’niz</h2>
        <p className="text-sm text-gray-600">
          Bu değeri paylaşarak çiftçinin/ mühendisin rapor erişimini bağlayın.
        </p>
        {myUid ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="text-lg font-mono font-semibold tracking-wide bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              {myUid}
            </code>
            <button
              type="button"
              onClick={() => void copyMyUid()}
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
            Firebase uid bulunamadı. Lütfen oturumu yenileyin.
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
            Mühendisin Firebase uid’sini girin. Bağlantı kurulunca Analyzer raporlarınız mühendisin panelinde (Çiftçi
            Raporları ve Sinyal Ölçümleri) görünür.
          </p>
          <form onSubmit={(e) => void handleLinkSubmit(e)} className="space-y-3">
            <label htmlFor="engineer-uid" className="text-sm font-medium text-gray-700 block">
              Mühendis Firebase uid
            </label>
            <input
              id="engineer-uid"
              type="text"
              autoComplete="off"
              value={engineerUidInput}
              onChange={(e) => setEngineerUidInput(e.target.value)}
              placeholder="Örn. UxC34dlb3OUvIDei5IZU8zTa7MY2"
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent font-mono"
            />
            {linkErr && <p className="text-sm text-red-600">{linkErr}</p>}
            {linkOk && <p className="text-sm text-green-700">Bağlantı kuruldu veya zaten geçerliydi.</p>}
            <button
              type="submit"
              disabled={linkBusy || !engineerUidInput.trim()}
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
                      {row.engineerLabel || row.engineerUid}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!isFarmer && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Bağlı çiftçiler</h2>
          <p className="text-sm text-gray-600">
            Çiftçi tarafında girilen mühendis uid’si sizin hesabınızla eşleştiyse burada listelenir. Ayrıntılı raporlar
            için <strong>Çiftçi Raporları</strong> ve sinyaller için <strong>Sinyal Ölçümleri</strong> sekmelerine
            bakın.
          </p>
          {farmerLinks.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz bağlı çiftçi yok.</p>
          ) : (
            <ul className="space-y-2">
              {farmerLinks.map((row) => (
                <li
                  key={row.farmerUid}
                  className="text-sm border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 space-y-1"
                >
                  <p className="font-medium text-gray-900">
                    {row.farmerLabel || row.farmerEmail || row.farmerUid}
                  </p>
                  {row.farmerEmail && row.farmerLabel && (
                    <p className="text-xs text-gray-600">{row.farmerEmail}</p>
                  )}
                  <code className="text-xs text-gray-700 font-mono block">uid: {row.farmerUid}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
