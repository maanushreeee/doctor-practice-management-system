import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Typography from '@mui/joy/Typography';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import CircularProgress from '@mui/joy/CircularProgress';
import Button from '@mui/joy/Button';
import Grid from '@mui/joy/Grid';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import { getDoctorProfile, getDoctorSlots } from '../../api/public';
import { createBooking, lockSlot, unlockSlot } from '../../api/patient';
import { useAuth } from '../../context/AuthContext';
import SlotCard from '../../components/SlotCard';

function getDayKey(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function getDayLabel(date) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  return targetStart.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DoctorDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token, role } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null); // slot selected for booking
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [selectedDayKey, setSelectedDayKey] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`[DoctorDetail] Loading doctor profile and slots for doctor ID: ${doctorId}`);
        const [doctorRes, slotsRes] = await Promise.all([
          getDoctorProfile(doctorId),
          getDoctorSlots(doctorId),
        ]);
        setDoctor(doctorRes.data);
        setSlots(slotsRes.data);
        console.log(`[DoctorDetail] Loaded doctor profile: ${doctorRes.data.name}, ${slotsRes.data.length} slots`);
      } catch (err) {
        console.error('[DoctorDetail] Error loading doctor details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctorId]);

  const handleBookClick = async (slot) => {
    if (!token) {
      localStorage.setItem('redirectAfter', `/doctors/${doctorId}`);
      navigate('/login/patient');
      return;
    }
    if (role !== 'patient') return;

    try {
      await lockSlot(slot.id);
      setBookingSlot(slot);
      setBookingSuccess(false);
      setBookingError('');
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Slot is no longer available. Please choose another.');
    }
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    setBookingError('');
    try {
      console.log('[DoctorDetail] Confirming booking for slot:', bookingSlot.id);
      await createBooking({ slot_id: bookingSlot.id });
      console.log('[DoctorDetail] Booking confirmed successfully');
      setBookingSuccess(true);
      // mark slot as booked in local state
      setSlots((prev) =>
        prev.map((s) => (s.id === bookingSlot.id ? { ...s, is_booked: true } : s))
      );
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Booking failed. Please try again.';
      console.error('[DoctorDetail] Booking error:', errorMsg);
      setBookingError(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseModal = async () => {
    // unlock slot if closing without booking
    if (bookingSlot && !bookingSuccess) {
      try {
        await unlockSlot(bookingSlot.id);
      } catch (err) {
        // silently ignore — lock will expire on its own
        console.error('Unlock failed:', err);
      }
    }
    setBookingSlot(null);
    setBookingSuccess(false);
    setBookingError('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#2b2d42' }} />
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography level="body-md" sx={{ color: '#8d99ae' }}>
          Doctor not found.
        </Typography>
      </Box>
    );
  }

  const sortedSlots = [...slots].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time)
  );

  const groupedSlots = sortedSlots.reduce((groups, slot) => {
    const slotDate = new Date(slot.start_time);
    const key = getDayKey(slotDate);

    if (!groups[key]) {
      groups[key] = {
        label: getDayLabel(slotDate),
        dateText: slotDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        slots: [],
      };
    }

    groups[key].slots.push(slot);
    return groups;
  }, {});

  const slotSections = Object.values(groupedSlots);
  const activeDayKey = selectedDayKey || Object.keys(groupedSlots)[0] || '';
  const activeSection = groupedSlots[activeDayKey];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#edf2f4', px: 4, py: 4 }}>
      <Box sx={{ maxWidth: 860, mx: 'auto' }}>

        {/* doctor profile card */}
        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent>

            {/* name and specialization */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography level="h1">{doctor.name}</Typography>
                <Typography
                  level="body-md"
                  sx={{ color: '#8d99ae', textTransform: 'capitalize', mt: 0.5 }}
                >
                  {doctor.specialization.replace(/_/g, ' ')}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography level="h2" sx={{ color: '#2b2d42' }}>
                  ₹{doctor.consultation_fee}
                </Typography>
                <Typography level="body-sm">per consultation</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* bio */}
            <Typography level="body-md" sx={{ mb: 2 }}>
              {doctor.bio}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* experience and qualifications */}
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
              <Box>
                <Typography level="body-sm" sx={{ color: '#8d99ae', mb: 0.5 }}>
                  Experience
                </Typography>
                <Typography level="body-md" sx={{ fontWeight: 600 }}>
                  {doctor.years_of_exp} {doctor.years_of_exp === 1 ? 'year' : 'years'}
                </Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ color: '#8d99ae', mb: 0.5 }}>
                  Qualifications
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {doctor.qualifications.map((q) => (
                    <Chip
                      key={q}
                      size="sm"
                      variant="soft"
                      sx={{ backgroundColor: '#edf2f4', color: '#2b2d42' }}
                    >
                      {q}
                    </Chip>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* services */}
            <Typography level="body-sm" sx={{ color: '#8d99ae', mb: 1 }}>
              Services Offered
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {doctor.services.map((s) => (
                <Chip
                  key={s}
                  size="sm"
                  variant="soft"
                  sx={{ backgroundColor: '#edf2f4', color: '#2b2d42', textTransform: 'capitalize' }}
                >
                  {s.replace(/_/g, ' ')}
                </Chip>
              ))}
            </Box>

          </CardContent>
        </Card>

        {/* available slots */}
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Typography level="h2">Available Slots</Typography>

          {slotSections.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {Object.entries(groupedSlots).map(([dayKey, section]) => (
                <Chip
                  key={dayKey}
                  size="sm"
                  variant={dayKey === activeDayKey ? 'solid' : 'soft'}
                  onClick={() => setSelectedDayKey(dayKey)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: dayKey === activeDayKey ? '#2b2d42' : '#ffffff',
                    color: dayKey === activeDayKey ? '#ffffff' : '#2b2d42',
                    border: '1px solid',
                    borderColor: dayKey === activeDayKey ? '#2b2d42' : '#d6dde3',
                  }}
                >
                  {section.label}
                </Chip>
              ))}
            </Box>
          )}
        </Box>

        {slots.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography level="body-md" sx={{ color: '#8d99ae', textAlign: 'center', py: 2 }}>
                No available slots at the moment.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {activeSection && activeSection.label !== activeSection.dateText && (
              <Typography level="body-sm" sx={{ color: '#8d99ae', textAlign: 'right', mb: 1.5 }}>
                {activeSection.dateText}
              </Typography>
            )}

            <Grid container spacing={2}>
              {activeSection?.slots.map((slot) => (
                <Grid key={slot.id} xs={12} sm={6} md={4}>
                  <SlotCard
                    slot={slot}
                    showBookButton={!slot.is_booked}
                    onBook={handleBookClick}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      </Box>

      {/* booking confirmation modal */}
      <Modal open={!!bookingSlot} onClose={handleCloseModal}>
        <ModalDialog sx={{ maxWidth: 400 }}>
          <ModalClose />

          {bookingSuccess ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography level="h2" sx={{ color: '#27ae60', mb: 1 }}>
                Booking Confirmed!
              </Typography>
              <Typography level="body-md" sx={{ color: '#8d99ae', mb: 3 }}>
                Your appointment request has been sent. The doctor will approve it shortly.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ borderColor: '#8d99ae', color: '#2b2d42' }}
                  onClick={handleCloseModal}
                >
                  Book Another
                </Button>
                <Button
                  fullWidth
                  sx={{ backgroundColor: '#2b2d42', '&:hover': { backgroundColor: '#3d3f57' } }}
                  onClick={() => navigate('/patient/bookings')}
                >
                  View Bookings
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography level="h2" sx={{ mb: 1 }}>Confirm Booking</Typography>
              <Typography level="body-sm" sx={{ color: '#8d99ae', mb: 3 }}>
                You are about to book the following slot with {doctor.name}
              </Typography>

              {bookingSlot && (
                <Card variant="soft" sx={{ mb: 3, backgroundColor: '#edf2f4' }}>
                  <CardContent>
                    <Typography level="body-sm" sx={{ color: '#8d99ae' }}>
                      {new Date(bookingSlot.start_time).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Typography>
                    <Typography level="h3">
                      {new Date(bookingSlot.start_time).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' — '}
                      {new Date(bookingSlot.end_time).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                    <Typography level="body-sm" sx={{ mt: 1 }}>
                      Consultation fee: ₹{doctor.consultation_fee}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {bookingError && (
                <Typography level="body-sm" sx={{ color: '#c0392b', mb: 2 }}>
                  {bookingError}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ borderColor: '#8d99ae', color: '#2b2d42' }}
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  loading={bookingLoading}
                  sx={{ backgroundColor: '#2b2d42', '&:hover': { backgroundColor: '#3d3f57' } }}
                  onClick={handleConfirmBooking}
                >
                  Confirm
                </Button>
              </Box>
            </Box>
          )}
        </ModalDialog>
      </Modal>

    </Box>
  );
}
