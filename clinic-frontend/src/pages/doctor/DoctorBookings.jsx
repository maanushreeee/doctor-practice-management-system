import { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import CircularProgress from '@mui/joy/CircularProgress';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Grid from '@mui/joy/Grid';
import { getDoctorBookings, approveBooking, rejectBooking } from '../../api/doctor';
import BookingCard from '../../components/BookingCard';
import PatientRecordDialog from '../../components/PatientRecordDialog';

export default function DoctorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // booking id currently being actioned
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('[DoctorBookings] Fetching doctor bookings');
      const res = await getDoctorBookings();
      setBookings(res.data);
      console.log(`[DoctorBookings] Loaded ${res.data.length} bookings`);
    } catch (err) {
      console.error('[DoctorBookings] Error fetching bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      console.log(`[DoctorBookings] Approving booking ${bookingId}`);
      await approveBooking(bookingId);
      // update local state instead of refetching
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'approved' } : b))
      );
      console.log(`[DoctorBookings] Booking ${bookingId} approved successfully`);
    } catch (err) {
      console.error(`[DoctorBookings] Error approving booking:`, err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      console.log(`[DoctorBookings] Rejecting booking ${bookingId}`);
      await rejectBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b))
      );
      console.log(`[DoctorBookings] Booking ${bookingId} rejected successfully`);
    } catch (err) {
      console.error(`[DoctorBookings] Error rejecting booking:`, err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRecord = (booking) => {
    setSelectedBooking(booking);
    setRecordDialogOpen(true);
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    rejected: bookings.filter((b) => b.status === 'rejected').length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#2b2d42' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#edf2f4', px: 4, py: 4 }}>

      {/* header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography level="h1">Bookings</Typography>
          <Typography level="body-sm">
            {counts.pending > 0
              ? `${counts.pending} pending booking${counts.pending > 1 ? 's' : ''} need your attention`
              : 'No pending bookings'}
          </Typography>
        </Box>

        {/* filter */}
        <Select
          value={filter}
          onChange={(_, val) => setFilter(val)}
          sx={{ minWidth: 160 }}
        >
          <Option value="all">All ({counts.all})</Option>
          <Option value="pending">Pending ({counts.pending})</Option>
          <Option value="approved">Approved ({counts.approved})</Option>
          <Option value="rejected">Rejected ({counts.rejected})</Option>
        </Select>
      </Box>

      {/* bookings list */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography level="body-md" sx={{ color: '#8d99ae' }}>
            No {filter === 'all' ? '' : filter} bookings found.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((booking) => (
            <Grid key={booking.id} xs={12} sm={6} md={4}>
              <BookingCard
                booking={booking}
                role="doctor"
                onApprove={handleApprove}
                onReject={handleReject}
                onOpenRecord={handleOpenRecord}
                loading={actionLoading === booking.id}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <PatientRecordDialog
        open={recordDialogOpen}
        booking={selectedBooking}
        onClose={() => setRecordDialogOpen(false)}
      />
    </Box>
  );
}
