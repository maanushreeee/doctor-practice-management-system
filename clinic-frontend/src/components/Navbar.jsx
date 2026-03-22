import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Divider from '@mui/joy/Divider';
import Chip from '@mui/joy/Chip';

export default function Navbar() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    console.log('[Navigation] Logging out user');
    logout();
    navigate('/');
  };

  const handleNavigation = (path) => {
    console.log(`[Navigation] Navigating to ${path}`);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#ffffff' : '#8d99ae',
    fontWeight: isActive(path) ? 600 : 400,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: isActive(path) ? '#3d3f57' : 'transparent',
    transition: 'all 0.2s',
    fontSize: '0.95rem',
  });

  const getRoleBadgeColor = () => {
    return role === 'patient' ? '#3b82f6' : '#8b5cf6';
  };

  const getRoleBadgeLabel = () => {
    return role === 'patient' ? 'Patient' : 'Doctor';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 4,
        py: 2,
        backgroundColor: '#2b2d42',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* logo */}
      <Typography
        level="h2"
        sx={{ color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '1.75rem' }}
        onClick={() => handleNavigation('/')}
      >
        WellBook
      </Typography>

      {/* nav links */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* public — always visible */}
        <button style={navLinkStyle('/')} onClick={() => handleNavigation('/')}>
          Home
        </button>

        {/* divider after home */}
        {token && <Divider orientation="vertical" sx={{ borderColor: '#3d3f57', my: 0 }} />}

        {/* patient links */}
        {token && role === 'patient' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button style={navLinkStyle('/patient/dashboard')} onClick={() => handleNavigation('/patient/dashboard')}>
              Dashboard
            </button>
            <button style={navLinkStyle('/patient/browse')} onClick={() => handleNavigation('/patient/browse')}>
              Find Doctors
            </button>
            <button style={navLinkStyle('/patient/bookings')} onClick={() => handleNavigation('/patient/bookings')}>
              My Bookings
            </button>
            <button style={navLinkStyle('/patient/profile')} onClick={() => handleNavigation('/patient/profile')}>
              Profile
            </button>
          </Box>
        )}

        {/* doctor links */}
        {token && role === 'doctor' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button style={navLinkStyle('/doctor/dashboard')} onClick={() => handleNavigation('/doctor/dashboard')}>
              Dashboard
            </button>
            <button style={navLinkStyle('/doctor/bookings')} onClick={() => handleNavigation('/doctor/bookings')}>
              Bookings
            </button>
            <button style={navLinkStyle('/doctor/slots')} onClick={() => handleNavigation('/doctor/slots')}>
              Slots
            </button>
            <button style={navLinkStyle('/doctor/profile')} onClick={() => handleNavigation('/doctor/profile')}>
              Profile
            </button>
          </Box>
        )}
      </Box>

      {/* auth buttons and role badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {token && <Divider orientation="vertical" sx={{ borderColor: '#3d3f57', my: 0 }} />}

        {token && (
          <Chip
            variant="soft"
            sx={{
              backgroundColor: getRoleBadgeColor(),
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '6px 10px',
            }}
          >
            {getRoleBadgeLabel()}
          </Chip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!token && (
            <>
              <Button
                variant="outlined"
                size="sm"
                sx={{ color: '#edf2f4', borderColor: '#8d99ae', '&:hover': { backgroundColor: '#3d3f57' }, fontSize: '0.9rem' }}
                onClick={() => handleNavigation('/login/patient')}
              >
                Patient Login
              </Button>
              <Button
                variant="solid"
                size="sm"
                sx={{ backgroundColor: '#8d99ae', '&:hover': { backgroundColor: '#6d7d8e' }, fontSize: '0.9rem' }}
                onClick={() => handleNavigation('/login/doctor')}
              >
                Doctor Login
              </Button>
            </>
          )}

          {token && (
            <Button
              variant="outlined"
              size="sm"
              sx={{ color: '#edf2f4', borderColor: '#8d99ae', '&:hover': { backgroundColor: '#3d3f57' }, fontSize: '0.9rem' }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}