import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listCategories, listEquipment } from '../../services/equipment.js';
import { createTransaction } from '../../services/transactions.js';
import { errorMessage } from '../../utils/errors.js';
import { LABS, ITEM_TYPES, labName } from '../../constants.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';

const KIND_ICONS = { durable: 'bi-box-seam', consumable: 'bi-droplet-half' };

export default function BorrowerRequest() {
  const { user } = useAuth();
  const [labId, setLabId] = useState('');
  const [kind, setKind] = useState('durable');
  const [labEquipment, setLabEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!labId) {
      setLabEquipment([]);
      setCategories([]);
      setCategoryId('');
      setCart([]);
      return;
    }
    setCategoryId('');
    setCart([]);
    Promise.all([listEquipment(labId), listCategories(labId)]).then(([eq, cats]) => {
      setLabEquipment(eq);
      setCategories(cats);
    });
  }, [labId]);

  const availableCategoryIds = useMemo(
    () => new Set(labEquipment.filter((e) => e.itemType === kind).map((e) => e.categoryId)),
    [labEquipment, kind]
  );
  const kindCategories = categories.filter((c) => availableCategoryIds.has(c.id));

  function handleKindChange(nextKind) {
    setKind(nextKind);
    setCategoryId('');
  }

  function addToCart() {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    setCart((c) => [...c, {
      key: `${Date.now()}-${Math.random()}`,
      kind, labId, categoryId, categoryName: category.name,
      expectedReturn: kind === 'durable' ? (expectedReturn || null) : null,
      quantity: kind === 'consumable' ? quantity : null,
    }]);
    setCategoryId('');
    setExpectedReturn('');
    setQuantity('');
  }

  function removeFromCart(key) {
    setCart((c) => c.filter((item) => item.key !== key));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!cart.length) {
      setError('Add at least one item to your request.');
      return;
    }
    setBusy(true);
    try {
      await createTransaction(cart.map(({ kind, labId, categoryId, expectedReturn, quantity }) => ({
        kind, labId, categoryId, expectedReturn, quantity, purpose,
      })), user);
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card">
            <div className="card-body text-center py-5">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--success-bg)', color: 'var(--success-fg)', fontSize: '1.6rem' }}
              >
                <i className="bi bi-check-lg"></i>
              </div>
              <h3 className="mb-2">Request submitted</h3>
              <p className="text-muted mb-4">
                Your request ({cart.length} item{cart.length > 1 ? 's' : ''}) is <strong>pending approval</strong> by that laboratory's custodian.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/borrower/history')}>
                <i className="bi bi-clock-history me-1"></i> View My Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <PageHeader
          title="New Request"
          subtitle="Borrow durable equipment or request consumable supplies from one laboratory."
          icon="bi-plus-square"
        />
        <div className="card mb-3">
          <PanelHeader icon="bi-buildings" title="Choose Laboratory &amp; Items" />
          <div className="card-body">
            <Alert onClose={() => setError('')}>{error}</Alert>

            <div className="mb-3">
              <label className="form-label">Laboratory</label>
              <select className="form-select" value={labId} onChange={(e) => setLabId(e.target.value)}>
                <option value="">Select laboratory</option>
                {LABS.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
              </select>
              <p className="small text-muted mt-1">All items in one request come from the same laboratory.</p>
            </div>

            {labId && (
              <>
                <hr />
                <div className="mb-3">
                  <label className="form-label">Request Type</label>
                  <div className="type-toggle">
                    {ITEM_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`type-toggle-option${kind === t.id ? ' active' : ''}`}
                        onClick={() => handleKindChange(t.id)}
                      >
                        <span className="panel-icon tone-brand"><i className={`bi ${KIND_ICONS[t.id]}`}></i></span>
                        <span className="type-toggle-option-label">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select category</option>
                    {kindCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {!kindCategories.length && (
                    <p className="small text-muted mt-1">No {kind} items are registered in this lab yet.</p>
                  )}
                </div>

                {kind === 'durable' ? (
                  <div className="mb-3">
                    <label className="form-label">Expected Return Date</label>
                    <input type="date" className="form-control" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label">Quantity Needed</label>
                    <input type="number" min="1" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  disabled={!categoryId || (kind === 'consumable' && !quantity)}
                  onClick={addToCart}
                >
                  <i className="bi bi-plus-lg"></i> Add to Request
                </button>
              </>
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="card mb-3">
            <PanelHeader icon="bi-cart3" title={`Items in This Request (${labName(labId)})`} count={cart.length} />
            <div>
              {cart.map((item) => (
                <div key={item.key} className="cart-item">
                  <span className="panel-icon tone-brand"><i className={`bi ${KIND_ICONS[item.kind]}`}></i></span>
                  <span className="flex-fill">
                    <span className="cart-item-label text-capitalize">{item.kind} — {item.categoryName}</span>
                    <span className="cart-item-sub d-block">
                      {item.kind === 'consumable' ? `Quantity: ${item.quantity}` : (item.expectedReturn ? `Return by ${new Date(item.expectedReturn).toLocaleDateString()}` : 'No return date set')}
                    </span>
                  </span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(item.key)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {cart.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="card">
              <PanelHeader icon="bi-send-check" tone="success" title="Finalize Request" />
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Purpose (applies to this whole request)</label>
                  <input type="text" className="form-control" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Titration experiment" />
                </div>
                <p className="small text-muted">
                  A specific unit or exact quantity will be confirmed by that lab's custodian once they act on this request.
                </p>
                <button type="submit" className="btn btn-primary w-100" disabled={busy}>
                  {busy ? 'Submitting…' : `Submit Request (${cart.length} item${cart.length > 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
