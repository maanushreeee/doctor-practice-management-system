import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Typography from '@mui/joy/Typography';
import Chip from '@mui/joy/Chip';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import Divider from '@mui/joy/Divider';
import { useState } from 'react';

const statusColors = {
  pending:   { bg: '#fff8e1', color: '#f59e0b' },
  approved:  { bg: '#e8f5e9', color: '#27ae60' },
  rejected:  { bg: '#fdecea', color: '#c0392b' },
  cancelled: { bg: '#f5f5f5', color: '#8d99ae' },
};

export default function BookingCard({ booking, onApprove, onReject, onCancel, onOpenRecord, role }) {
  const [loading, setLoading] = useState(false);

  const formatDateTime = (dt) =>
    new Date(dt).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const { bg, color } = statusColors[booking.status] || statusColors.pending;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography level="h3">
            {role === 'doctor' ? booking.patient_name : `Booking #${booking.id.slice(-6)}`}
          </Typography>
          <Chip size="sm" sx={{ backgroundColor: bg, color, fontWeight: 600, textTransform: 'capitalize' }}>
            {booking.status}
          </Chip>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography level="body-sm" sx={{ mb: 0.5 }}>
          Booked at: {formatDateTime(booking.booked_at)}
        </Typography>

        {/* doctor actions */}
        {role === 'doctor' && booking.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="sm"
              fullWidth
              variant="solid"
              sx={{ backgroundColor: '#27ae60', '&:hover': { backgroundColor: '#219a52' } }}
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await onApprove(booking.id);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              fullWidth
              variant="outlined"
              sx={{ color: '#c0392b', borderColor: '#c0392b', '&:hover': { backgroundColor: '#fdecea' } }}
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await onReject(booking.id);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Reject
            </Button>
          </Box>
        )}

        {role === 'doctor' && booking.status === 'approved' && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="sm"
              fullWidth
              variant="soft"
              sx={{ backgroundColor: '#edf2f4', color: '#2b2d42' }}
              onClick={() => onOpenRecord?.(booking)}
            >
              Patient Record
            </Button>
          </Box>
        )}

        {/* patient cancel */}
        {role === 'patient' && booking.status === 'pending' && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="sm"
              fullWidth
              variant="outlined"
              sx={{ color: '#c0392b', borderColor: '#c0392b', '&:hover': { backgroundColor: '#fdecea' } }}
              loading={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await onCancel(booking.id);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Cancel Booking
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
