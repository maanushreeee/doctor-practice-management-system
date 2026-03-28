import { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import CircularProgress from '@mui/joy/CircularProgress';
import Input from '@mui/joy/Input';
import Textarea from '@mui/joy/Textarea';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import {
  createPatientRecord,
  getDoctorPatientRecords,
  updatePatientRecord,
} from '../api/doctor';

const EMPTY_RECORD_FORM = {
  chief_complaint: '',
  symptoms: '',
  diagnosis: '',
  prescription: '',
  notes: '',
  follow_up_date: '',
};

function toRecordForm(record) {
  return {
    chief_complaint: record?.chief_complaint || '',
    symptoms: record?.symptoms || '',
    diagnosis: record?.diagnosis || '',
    prescription: record?.prescription || '',
    notes: record?.notes || '',
    follow_up_date: record?.follow_up_date
      ? new Date(record.follow_up_date).toISOString().slice(0, 10)
      : '',
  };
}

function buildRecordPayload(form) {
  return {
    chief_complaint: form.chief_complaint.trim(),
    symptoms: form.symptoms.trim(),
    diagnosis: form.diagnosis.trim(),
    prescription: form.prescription.trim(),
    notes: form.notes.trim(),
    follow_up_date: form.follow_up_date || null,
  };
}

export default function PatientRecordDialog({ open, booking, onClose }) {
  const [existingRecord, setExistingRecord] = useState(null);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD_FORM);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [recordSuccess, setRecordSuccess] = useState('');

  useEffect(() => {
    const loadRecord = async () => {
      if (!open || !booking || booking.status !== 'approved') {
        setExistingRecord(null);
        setRecordForm(EMPTY_RECORD_FORM);
        setRecordError('');
        setRecordSuccess('');
        setRecordLoading(false);
        return;
      }

      setRecordLoading(true);
      setRecordError('');
      setRecordSuccess('');

      try {
        const res = await getDoctorPatientRecords(booking.patient_id);
        const matchedRecord = res.data.find((record) => record.booking_id === booking.id) || null;
        setExistingRecord(matchedRecord);
        setRecordForm(matchedRecord ? toRecordForm(matchedRecord) : EMPTY_RECORD_FORM);
      } catch (err) {
        setExistingRecord(null);
        setRecordForm(EMPTY_RECORD_FORM);
        setRecordError(err.response?.data?.detail || 'Unable to load patient record.');
      } finally {
        setRecordLoading(false);
      }
    };

    loadRecord();
  }, [open, booking]);

  const handleRecordChange = (e) => {
    setRecordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRecordSubmit = async () => {
    if (!booking) return;

    const payload = buildRecordPayload(recordForm);
    if (!payload.chief_complaint || !payload.diagnosis) {
      setRecordError('Chief complaint and diagnosis are required.');
      setRecordSuccess('');
      return;
    }

    setRecordSaving(true);
    setRecordError('');
    setRecordSuccess('');

    try {
      const res = existingRecord
        ? await updatePatientRecord(existingRecord.id, payload)
        : await createPatientRecord({ booking_id: booking.id, ...payload });

      setExistingRecord(res.data);
      setRecordForm(toRecordForm(res.data));
      setRecordSuccess(existingRecord ? 'Patient record updated.' : 'Patient record saved.');
    } catch (err) {
      setRecordError(err.response?.data?.detail || 'Unable to save patient record.');
    } finally {
      setRecordSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 'min(640px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto' }}>
        <ModalClose />

        <Box sx={{ mb: 2 }}>
          <Typography level="h3">Patient Record</Typography>
          <Typography level="body-sm" sx={{ color: '#8d99ae' }}>
            {booking ? `For ${booking.patient_name}` : 'Select a booking to continue'}
          </Typography>
        </Box>

        {recordLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size="sm" />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControl>
              <FormLabel>Chief Complaint</FormLabel>
              <Input
                name="chief_complaint"
                value={recordForm.chief_complaint}
                onChange={handleRecordChange}
                placeholder="Primary issue reported by the patient"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Symptoms</FormLabel>
              <Textarea
                name="symptoms"
                minRows={2}
                value={recordForm.symptoms}
                onChange={handleRecordChange}
                placeholder="Symptoms and duration"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Diagnosis</FormLabel>
              <Textarea
                name="diagnosis"
                minRows={2}
                value={recordForm.diagnosis}
                onChange={handleRecordChange}
                placeholder="Clinical assessment"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Prescription</FormLabel>
              <Textarea
                name="prescription"
                minRows={2}
                value={recordForm.prescription}
                onChange={handleRecordChange}
                placeholder="Medicines and dosage"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                name="notes"
                minRows={2}
                value={recordForm.notes}
                onChange={handleRecordChange}
                placeholder="Additional advice or observations"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Follow-up Date</FormLabel>
              <Input
                name="follow_up_date"
                type="date"
                value={recordForm.follow_up_date}
                onChange={handleRecordChange}
              />
            </FormControl>

            {recordError && (
              <Typography level="body-sm" sx={{ color: '#c0392b' }}>
                {recordError}
              </Typography>
            )}

            {recordSuccess && (
              <Typography level="body-sm" sx={{ color: '#27ae60' }}>
                {recordSuccess}
              </Typography>
            )}

            <Button
              loading={recordSaving}
              onClick={handleRecordSubmit}
              sx={{ mt: 1, backgroundColor: '#2b2d42', '&:hover': { backgroundColor: '#3d3f57' } }}
            >
              {existingRecord ? 'Update Record' : 'Save Record'}
            </Button>
          </Box>
        )}
      </ModalDialog>
    </Modal>
  );
}
