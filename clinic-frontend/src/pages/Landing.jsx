import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';
import CircularProgress from '@mui/joy/CircularProgress';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import DoctorCard from '../components/DoctorCard';
import { getDoctors } from '../api/public';
import { SPECIALIZATIONS } from '../constants';
import HeroIllustration from '../assets/hero.png';

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ step, title, desc, index, visible }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 3,
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 12px rgba(43,45,66,0.08)',
        cursor: 'pointer',
        transition: [
          `opacity 0.5s ease ${index * 0.15}s`,
          `transform 0.5s ease ${index * 0.15}s`,
          'background-color 0.2s ease',
        ].join(', '),
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        '&:hover': {
          backgroundColor: '#8d99ae',
          '& .step-number': {
            backgroundColor: '#ffffff',
            color: '#2b2d42',
          },
          '& .step-title': { color: '#ffffff' },
          '& .step-desc': { color: '#edf2f4' },
        },
      }}
    >
      <Box
        className="step-number"
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#edf2f4',
          color: '#2b2d42',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          fontSize: '1.25rem',
          fontWeight: 700,
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}
      >
        {step}
      </Box>
      <Typography
        className="step-title"
        level="h4"
        sx={{ color: '#2b2d42', mb: 0.5, transition: 'color 0.2s ease' }}
      >
        {title}
      </Typography>
      <Typography
        className="step-desc"
        level="body-sm"
        sx={{ color: '#8d99ae', transition: 'color 0.2s ease' }}
      >
        {desc}
      </Typography>
    </Box>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────
function StatItem({ value, label, index, visible }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <Typography level="h2" sx={{ color: '#2b2d42', fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography level="body-sm" sx={{ color: '#8d99ae' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { step: '1', title: 'Find a Doctor', desc: 'Browse by specialization or service' },
  { step: '2', title: 'Book a Slot', desc: 'Pick a time that works for you' },
  { step: '3', title: 'Get Confirmed', desc: 'Doctor reviews and approves' },
  { step: '4', title: 'Consult', desc: 'Visit the clinic at your slot time' },
];

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function Landing() {
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSpecialization, setActiveSpecialization] = useState('');
  const navigate = useNavigate();

  const doctorsRef = useRef(null);
  const statsReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const doctorCtaReveal = useScrollReveal();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await getDoctors(filters);
      setDoctors(res.data);
      if (!filters.specialization) setAllDoctors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationClick = (spec) => {
    if (activeSpecialization === spec) {
      setActiveSpecialization('');
      setDoctors(allDoctors);
    } else {
      setActiveSpecialization(spec);
      fetchDoctors({ specialization: spec });
    }
    doctorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearFilter = () => {
    setActiveSpecialization('');
    setDoctors(allDoctors);
  };

  const stats = [
    { value: `${allDoctors.length}+`, label: 'Verified Doctors' },
    { value: `${SPECIALIZATIONS.length}+`, label: 'Specializations' },
    { value: '500+', label: 'Patients Served' },
    { value: '24/7', label: 'Available' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#edf2f4' }}>

      {/* ── HERO ── */}
      <Box
        sx={{
          backgroundColor: '#2b2d42',
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 8 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {/* left — text + CTAs */}
        <Box sx={{ flex: 1, minWidth: 280, maxWidth: 560 }}>
          <Typography
            level="h1"
            sx={{
              color: '#ffffff',
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Your Health,<br />
            <Box component="span" sx={{ color: '#8d99ae' }}>
              Our Priority
            </Box>
          </Typography>
          <Typography level="body-md" sx={{ color: '#b3c0cc', mb: 4, maxWidth: 440 }}>
            Find verified doctors, book appointments instantly and manage
            your healthcare all in one place.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              size="lg"
              sx={{
                backgroundColor: '#ffffff',
                color: '#2b2d42',
                fontWeight: 700,
                '&:hover': { backgroundColor: '#edf2f4' },
              }}
              onClick={() => navigate('/register/patient')}
            >
              Book Appointment
            </Button>
            <Button
              size="lg"
              variant="outlined"
              sx={{
                borderColor: '#8d99ae',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#3d3f57' },
              }}
              onClick={() => navigate('/signup/doctor')}
            >
              Join as Doctor
            </Button>
          </Box>
        </Box>

        {/* right — hero illustration */}
        <Box
          sx={{
            flex: 1,
            minWidth: 240,
            maxWidth: 520,
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={HeroIllustration}
            alt="Healthcare illustration"
            style={{
              width: '100%',
              maxWidth: 580,
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>

      {/* ── STATS BAR ── */}
      <Box
        ref={statsReveal.ref}
        sx={{
          backgroundColor: '#ffffff',
          px: 4,
          py: 3,
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 2px 8px rgba(43,45,66,0.06)',
        }}
      >
        {stats.map((stat, i) => (
          <StatItem key={i} {...stat} index={i} visible={statsReveal.visible} />
        ))}
      </Box>

      {/* ── SPECIALIZATIONS GRID ── */}
      <Box sx={{ px: 4, py: 6 }}>
        <Typography level="h2" sx={{ textAlign: 'center', mb: 1, color: '#2b2d42' }}>
          Browse by Specialization
        </Typography>
        <Typography level="body-sm" sx={{ textAlign: 'center', color: '#8d99ae', mb: 4 }}>
          Click a specialization to filter doctors
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'center',
            maxWidth: 800,
            mx: 'auto',
          }}
        >
          {SPECIALIZATIONS.map((spec) => (
            <Chip
              key={spec}
              size="lg"
              variant={activeSpecialization === spec ? 'solid' : 'outlined'}
              onClick={() => handleSpecializationClick(spec)}
              sx={{
                cursor: 'pointer',
                textTransform: 'capitalize',
                backgroundColor: activeSpecialization === spec ? '#2b2d42' : '#ffffff',
                color: activeSpecialization === spec ? '#ffffff' : '#2b2d42',
                borderColor: '#8d99ae',
                fontWeight: activeSpecialization === spec ? 600 : 400,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: activeSpecialization === spec ? '#3d3f57' : 'var(--solidActiveBg)',
                },
              }}
            >
              {spec.replace(/_/g, ' ')}
            </Chip>
          ))}
        </Box>
      </Box>

      {/* ── HOW IT WORKS ── */}
      <Box
        ref={howItWorksReveal.ref}
        sx={{ px: 4, py: 6, backgroundColor: '#ffffff' }}
      >
        <Typography level="h2" sx={{ textAlign: 'center', mb: 1, color: '#2b2d42' }}>
          How It Works
        </Typography>
        <Typography level="body-sm" sx={{ textAlign: 'center', color: 'var(--solidActiveBg)', mb: 4 }}>
          Book your appointment in 4 simple steps
        </Typography>
        <Grid container spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
          {STEPS.map((item, idx) => (
            <Grid key={idx} xs={12} sm={6} md={3}>
              <StepCard {...item} index={idx} visible={howItWorksReveal.visible} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── FEATURED DOCTORS ── */}
      <Box ref={doctorsRef} sx={{ px: 4, py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography level="h2" sx={{ color: '#2b2d42' }}>
              {activeSpecialization
                ? `${activeSpecialization.replace(/_/g, ' ')} Doctors`
                : 'Featured Doctors'}
            </Typography>
            <Typography level="body-sm" sx={{ color: '#8d99ae' }}>
              {activeSpecialization
                ? `Showing doctors for ${activeSpecialization.replace(/_/g, ' ')}`
                : 'Top rated specialists on our platform'}
            </Typography>
          </Box>
          {activeSpecialization && (
            <Button
              variant="outlined"
              size="sm"
              sx={{ borderColor: '#8d99ae', color: '#2b2d42' }}
              onClick={handleClearFilter}
            >
              Clear Filter
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#2b2d42' }} />
          </Box>
        ) : doctors.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level="body-md" sx={{ color: '#8d99ae', mb: 2 }}>
              No doctors found for this specialization.
            </Typography>
            <Button
              variant="outlined"
              sx={{ borderColor: '#8d99ae', color: '#2b2d42' }}
              onClick={handleClearFilter}
            >
              Show All Doctors
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {doctors.slice(0, 6).map((doctor) => (
              <Grid key={doctor.id} xs={12} sm={6} md={4}>
                <DoctorCard doctor={doctor} />
              </Grid>
            ))}
          </Grid>
        )}

        {doctors.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              size="lg"
              variant="outlined"
              sx={{ borderColor: '#2b2d42', color: '#2b2d42' }}
              onClick={() => navigate('/patient/browse')}
            >
              Browse All Doctors
            </Button>
          </Box>
        )}
      </Box>

      {/* ── DOCTOR CTA ── */}
      <Box
        ref={doctorCtaReveal.ref}
        sx={{
          backgroundColor: '#2b2d42',
          px: 4,
          py: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 3,
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          opacity: doctorCtaReveal.visible ? 1 : 0,
          transform: doctorCtaReveal.visible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        <Box>
          <Typography level="h2" sx={{ color: '#ffffff', mb: 1 }}>
            Are you a Doctor?
          </Typography>
          <Typography level="body-md" sx={{ color: '#8d99ae', maxWidth: 480 }}>
            Join our platform to manage your appointments, slots and patient
            bookings all in one place.
          </Typography>
        </Box>
        <Button
          size="lg"
          sx={{
            backgroundColor: '#ffffff',
            color: '#2b2d42',
            fontWeight: 700,
            '&:hover': { backgroundColor: '#edf2f4' },
          }}
          onClick={() => navigate('/signup/doctor')}
        >
          Join as a Doctor
        </Button>
      </Box>

      {/* ── FOOTER ── */}
      <Box
        sx={{
          backgroundColor: '#1e202e',
          px: 4,
          py: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography level="body-sm" sx={{ color: '#8d99ae' }}>
          © 2026 Clinic. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {[
            { label: 'Patient Login', path: '/login/patient' },
            { label: 'Doctor Login', path: '/login/doctor' },
            { label: 'Join as Doctor', path: '/signup/doctor' },
          ].map(({ label, path }) => (
            <Typography
              key={path}
              level="body-sm"
              sx={{ color: '#8d99ae', cursor: 'pointer', '&:hover': { color: '#ffffff' } }}
              onClick={() => navigate(path)}
            >
              {label}
            </Typography>
          ))}
        </Box>
      </Box>

    </Box>
  );
}