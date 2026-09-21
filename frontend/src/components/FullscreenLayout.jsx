import { Outlet } from 'react-router-dom';

export default function FullscreenLayout() {
  return (
    <div className="w-full h-full min-h-screen bg-background relative">
      <Outlet />
    </div>
  );
}
