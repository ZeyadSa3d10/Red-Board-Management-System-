import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/realApi';
import { useNotifications } from '../../context/NotificationContext';

const AddClientModal = ({ show, onClose, onClientAdded, initialPhone = '' }) => {
  const { addNotification } = useNotifications();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setPhone(initialPhone); }, [initialPhone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    if (!phone) {
      addNotification('رقم الهاتف مطلوب للعميل', 'danger');
      return;
    }

    setSaving(true);
    try {
      const newClient = await api.createClient({
        name,
        phone,
        address,
        creditLimit: Number(creditLimit),
        openingBalance: 0
      });
      addNotification('تم إضافة العميل بنجاح', 'success');
      onClientAdded(newClient);
      onClose();
      setName('');
      setPhone('');
      setAddress('');
      setCreditLimit(0);
    } catch (err) {
      addNotification(err?.message || 'فشل في إضافة العميل', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="إضافة عميل جديد">
      <form onSubmit={handleSubmit} style={{ padding: '10px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>الاسم *</label>
          <input
            type="text"
            className="form-control-custom"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>رقم الهاتف *</label>
          <input
            type="text"
            className="form-control-custom"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>العنوان</label>
          <input
            type="text"
            className="form-control-custom"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>الحد الائتماني</label>
          <input
            type="number"
            className="form-control-custom"
            value={creditLimit}
            onChange={e => setCreditLimit(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="submit"
            className="btn-custom btn-custom-primary"
            style={{ flex: 1 }}
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            className="btn-custom btn-custom-outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={saving}
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddClientModal;
