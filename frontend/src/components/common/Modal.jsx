import { BsX } from 'react-icons/bs';
import { useEffect, useState } from 'react';

const Modal = ({ show, onClose, title, children, size = 'md', footer }) => {
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setAnimOut(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  const handleClose = () => {
    setAnimOut(true);
    setTimeout(() => {
      setAnimOut(false);
      onClose();
    }, 150);
  };

  if (!show && !animOut) return null;

  const sizeMap = { sm: 400, md: 600, lg: 800, xl: 1000 };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: sizeMap[size] || 600,
          animation: animOut ? 'fadeOut 0.15s ease forwards' : 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5>{title}</h5>
          <button onClick={handleClose} className="modal-close-btn"><BsX size={22} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
