import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  children,
}) => {
  return (
    <div className="context-menu" style={{ top: y, left: x }} onClick={onClose}>
      {children}
    </div>
  );
};

export default ContextMenu;
