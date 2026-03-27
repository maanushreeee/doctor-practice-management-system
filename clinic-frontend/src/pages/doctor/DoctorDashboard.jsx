import { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Typography from '@mui/joy/Typography';
import Chip from '@mui/joy/Chip';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import {
  BarChart, Bar, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  getDoctorBookings,
  getDoctorSlots,
  approveBooking,
  rejectBooking,
} from '../../api/doctor';
import PatientRecordDialog from '../../components/PatientRecordDialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const STATUS_COLORS = {
  pending:   { bg: '#fff8e1', color: '#f59e0b' },
  approved:  { bg: '#e8f5e9', color: '#27ae60' },
  rejected:  { bg: '#fdecea', color: '#c0392b' },
  cancelled: { bg: '#f5f5f5', color: '#8d99ae' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardWithBar({ label, value, data }) {
  return (
    <Card
      variant="soft"
      sx={{ height: '100%', backgroundColor: 'var(--joy-palette-background-level1)' }}
    >
      <CardContent>
        <Typography level="body-sm" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography level="h1" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        <ResponsiveContainer width="100%" height={50}>
          <BarChart data={data} barSize={6}>
            <Bar
              dataKey="count"
              fill="var(--joy-palette-primary-300)"
              radius={[4, 4, 0, 0]}
            />
            <Tooltip
              contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
              formatter={(v) => [v, 'bookings']}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function StatCardWithLine({ label, value, data }) {
  return (
    <Card
      variant="soft"
      sx={{
        height: '100%',
        backgroundColor: STATUS_COLORS.approved.bg,
        border: '1px solid rgba(39, 174, 96, 0.18)',
      }}
    >
      <CardContent>
        <Typography level="body-sm" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography level="h1" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="count"
              stroke={STATUS_COLORS.approved.color}
              strokeWidth={2}
              dot={false}
            />
            <Tooltip
              contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
              formatter={(v) => [v, 'approved']}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function StatCardSimple({ label, value, sub }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography level="body-sm" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography level="h1" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {sub && (
          <Typography level="body-sm" sx={{ mt: 0.5 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function BookingStatusCard({ counts }) {
  const total = counts.pending + counts.approved + counts.rejected + counts.cancelled;
  const bars = [
    { label: 'Pending',   count: counts.pending,   color: '#f59e0b' },
    { label: 'Approved',  count: counts.approved,  color: '#27ae60' },
    { label: 'Rejected',  count: counts.rejected,  color: '#c0392b' },
    { label: 'Cancelled', count: counts.cancelled, color: 'var(--joy-palette-primary-300)' },
  ];

  return (
    <Card
      variant="solid"
      sx={{ height: '100%', backgroundColor: 'var(--joy-palette-primary-500)' }}
    >
      <CardContent>
        <Typography level="h3" sx={{ color: '#ffffff', mb: 0.5 }}>
          Booking Status
        </Typography>
        <Typography level="body-sm" sx={{ color: 'var(--joy-palette-primary-300)', mb: 2 }}>
          {total} total bookings
        </Typography>

        {bars.map((bar) => (
          <Box key={bar.label} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography level="body-sm" sx={{ color: 'var(--joy-palette-primary-200)' }}>
                {bar.label}
              </Typography>
              <Typography level="body-sm" sx={{ color: '#ffffff', fontWeight: 600 }}>
                {bar.count}
              </Typography>
            </Box>
            <Box sx={{ height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
              <Box
                sx={{
                  height: '100%',
                  width: total > 0 ? `${(bar.count / total) * 100}%` : '0%',
                  backgroundColor: bar.color,
                  borderRadius: 4,
                  transition: 'width 0.8s ease',
                }}
              />
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

function SlotUtilizationCard({ slots }) {
  const today = new Date().toDateString();
  const todaySlots = slots.filter((s) => new Date(s.start_time).toDateString() === today);
  const booked = todaySlots.filter((s) => s.is_booked).length;
  const available = todaySlots.filter((s) => !s.is_booked).length;
  const pct = todaySlots.length > 0 ? Math.round((booked / todaySlots.length) * 100) : 0;

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const daySlots = slots.filter(
      (s) => new Date(s.start_time).toDateString() === d.toDateString()
    );
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      total: daySlots.length,
      booked: daySlots.filter((s) => s.is_booked).length,
    };
  });

  return (
    <Card
      variant="soft"
      sx={{ height: '100%', backgroundColor: 'var(--joy-palette-background-level1)' }}
    >
      <CardContent>
        <Typography level="h3" sx={{ mb: 0.5 }}>
          Slot Utilization
        </Typography>
        <Typography level="body-sm" sx={{ mb: 2 }}>
          Today — {booked} booked · {available} available · {pct}% full
        </Typography>

        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weekData} barSize={10} barGap={2}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--joy-palette-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="total"  fill="var(--joy-palette-primary-100)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="booked" fill="var(--joy-palette-primary-500)" radius={[4, 4, 0, 0]} />
            <Tooltip
              contentStyle={{ fontSize: '11px' }}
              formatter={(v, n) => [v, n === 'booked' ? 'Booked' : 'Total']}
            />
          </BarChart>
        </ResponsiveContainer>

        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--joy-palette-primary-500)' }} />
            <Typography level="body-sm">Booked</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--joy-palette-primary-100)' }} />
            <Typography level="body-sm">Total</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function TodayTimeline({ slots }) {
  const today = new Date().toDateString();
  const todaySlots = slots
    .filter((s) => new Date(s.start_time).toDateString() === today)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography level="h3" sx={{ mb: 0.5 }}>
          Today's Timeline
        </Typography>
        <Typography level="body-sm" sx={{ mb: 2 }}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </Typography>

        {todaySlots.length === 0 ? (
          <Typography level="body-sm" sx={{ textAlign: 'center', py: 3 }}>
            No slots today
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 240, overflowY: 'auto' }}>
            {todaySlots.map((slot) => (
              <Box
                key={slot.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: slot.is_booked
                    ? 'var(--joy-palette-background-level2)'
                    : 'var(--joy-palette-background-level1)',
                }}
              >
                <Typography level="body-sm" sx={{ minWidth: 50, fontSize: '0.75rem' }}>
                  {formatTime(slot.start_time)}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: slot.is_booked ? '#f59e0b' : '#27ae60',
                    flexShrink: 0,
                  }}
                />
                <Typography level="body-sm" sx={{ fontSize: '0.8rem' }}>
                  {slot.is_booked ? 'Booked' : 'Available'}
                </Typography>
                <Typography level="body-sm" sx={{ ml: 'auto', fontSize: '0.75rem' }}>
                  {formatTime(slot.end_time)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function BookingsList({ bookings, selectedId, onSelect }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography level="h3" sx={{ mb: 2 }}>
          Recent Bookings
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto' }}>
          {bookings.slice(0, 10).map((booking) => {
            const { bg, color } = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
            const isSelected = selectedId === booking.id;
            return (
              <Box
                key={booking.id}
                onClick={() => onSelect(booking)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? 'var(--joy-palette-background-level1)'
                    : 'transparent',
                  border: isSelected
                    ? '1px solid var(--joy-palette-primary-300)'
                    : '1px solid transparent',
                  '&:hover': { backgroundColor: 'var(--joy-palette-background-level1)' },
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: 'var(--joy-palette-primary-500)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                    }}
                  >
                    {booking.patient_name?.[0]?.toUpperCase() || 'P'}
                  </Box>
                  <Box>
                    <Typography
                      level="body-sm"
                      sx={{ color: 'var(--joy-palette-text-primary)', fontWeight: 600 }}
                    >
                      {booking.patient_name}
                    </Typography>
                    <Typography level="body-sm" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(booking.booked_at)}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  size="sm"
                  sx={{ backgroundColor: bg, color, fontWeight: 600, textTransform: 'capitalize' }}
                >
                  {booking.status}
                </Chip>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function BookingDetail({
  booking,
  onApprove,
  onReject,
  actionLoading,
  onOpenRecord,
}) {
  if (!booking) {
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography level="h3" sx={{ mb: 1 }}>
            Booking Detail
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography level="body-sm">
              Select a booking to view details
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { bg, color } = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="h3">Booking Detail</Typography>
          <Chip
            size="sm"
            sx={{ backgroundColor: bg, color, fontWeight: 600, textTransform: 'capitalize' }}
          >
            {booking.status}
          </Chip>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DetailRow label="Patient"    value={booking.patient_name} />
          <DetailRow label="Contact"    value={booking.patient_contact} />
          <DetailRow label="Booked At"  value={new Date(booking.booked_at).toLocaleString('en-IN')} />
          <DetailRow label="Booking ID" value={`#${booking.id?.slice(-8)}`} />
        </Box>

        {booking.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              fullWidth
              loading={actionLoading}
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#219a52' } }}
              onClick={() => onApprove(booking.id)}
            >
              Approve
            </Button>
            <Button
              fullWidth
              variant="outlined"
              disabled={actionLoading}
              sx={{ color: '#c0392b', borderColor: '#c0392b', '&:hover': { backgroundColor: '#fdecea' } }}
              onClick={() => onReject(booking.id)}
            >
              Reject
            </Button>
          </Box>
        )}

        {booking.status === 'approved' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Button
              fullWidth
              variant="solid"
              onClick={onOpenRecord}
              sx={{
                mt: 1,
                backgroundColor: '#2b2d42',
                '&:hover': { backgroundColor: '#3d3f57' },
              }}
            >
              Open Patient Record
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography level="body-sm" sx={{ minWidth: 90 }}>
        {label}
      </Typography>
      <Typography
        level="body-sm"
        sx={{ color: 'var(--joy-palette-text-primary)', fontWeight: 500 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, slotsRes] = await Promise.all([
          getDoctorBookings(),
          getDoctorSlots(),
        ]);
        setBookings(bookingsRes.data);
        setSlots(slotsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setRecordDialogOpen(false);
  }, [selectedBooking?.id]);

  const handleApprove = async (bookingId) => {
    setActionLoading(true);
    try {
      await approveBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: 'approved' } : b)
      );
      setSelectedBooking((prev) =>
        prev?.id === bookingId ? { ...prev, status: 'approved' } : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (bookingId) => {
    setActionLoading(true);
    try {
      await rejectBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => b.id === bookingId ? { ...b, status: 'rejected' } : b)
      );
      setSelectedBooking((prev) =>
        prev?.id === bookingId ? { ...prev, status: 'rejected' } : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Computed data ──────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todaySlots = slots.filter((s) => new Date(s.start_time).toDateString() === today);
  const availableToday = todaySlots.filter((s) => !s.is_booked).length;

  const counts = {
    pending:   bookings.filter((b) => b.status === 'pending').length,
    approved:  bookings.filter((b) => b.status === 'approved').length,
    rejected:  bookings.filter((b) => b.status === 'rejected').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: bookings.filter(
        (b) => new Date(b.booked_at).toDateString() === d.toDateString()
      ).length,
    };
  });

  const approvedTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      count: bookings.filter(
        (b) =>
          b.status === 'approved' &&
          new Date(b.booked_at).toDateString() === d.toDateString()
      ).length,
    };
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'var(--joy-palette-background-body)',
        px: 4,
        py: 4,
      }}
    >
      {/* ── Greeting ── */}
      <Box sx={{ mb: 4 }}>
        <Typography level="h1">
          Good {getTimeOfDay()}, Dr. {user?.name?.split(' ')[0]}
        </Typography>
        <Typography level="body-sm">
          {counts.pending > 0
            ? `${counts.pending} booking${counts.pending > 1 ? 's' : ''} waiting for your approval`
            : 'No pending bookings — all caught up!'}
        </Typography>
      </Box>

      {/* ── Stats Row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCardWithBar label="Pending Bookings" value={counts.pending} data={last7Days} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCardWithLine label="Approved Bookings" value={counts.approved} data={approvedTrend} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCardSimple label="Today's Slots" value={todaySlots.length} sub={`${availableToday} available`} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCardSimple label="Total Bookings" value={bookings.length} sub="all time" />
        </Grid>
      </Grid>

      {/* ── Middle Row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} md={4}>
          <BookingStatusCard counts={counts} />
        </Grid>
        <Grid xs={12} md={4}>
          <SlotUtilizationCard slots={slots} />
        </Grid>
        <Grid xs={12} md={4}>
          <TodayTimeline slots={slots} />
        </Grid>
      </Grid>

      {/* ── Bottom Row ── */}
      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <BookingsList
            bookings={bookings}
            selectedId={selectedBooking?.id}
            onSelect={setSelectedBooking}
          />
        </Grid>
        <Grid xs={12} md={6}>
          <BookingDetail
            booking={selectedBooking}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
            onOpenRecord={() => setRecordDialogOpen(true)}
          />
        </Grid>
      </Grid>

      <PatientRecordDialog
        open={recordDialogOpen}
        booking={selectedBooking}
        onClose={() => setRecordDialogOpen(false)}
      />
    </Box>
  );
}
