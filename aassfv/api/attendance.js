// file: api/attendance.js

export default async function handler(req, res) {
  // Your secret Firebase credentials will be securely loaded from Vercel's Environment Variables
  const apiKey = process.env.API_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  // Helper function to call Firebase
  async function callFirebase(method, path, data = null) {
    const url = `${databaseUrl}${path}.json?auth=${apiKey}`;
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    try {
      const firebaseResponse = await fetch(url, options);
      return await firebaseResponse.json();
    } catch (error) {
      return { error: 'Failed to connect to Firebase.' };
    }
  }

  // Handle Different Requests
  if (req.method === 'GET') {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }
    const students = await callFirebase('GET', '/students');
    const attendance = await callFirebase('GET', `/attendance/${date}`);
    return res.status(200).json({ students, attendance: attendance || {} });
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const { date, studentId } = req.body;
    if (!date || !studentId) {
      return res.status(400).json({ error: 'Date and Student ID are required.' });
    }

    if (req.method === 'POST') {
      const studentData = await callFirebase('GET', `/students/${studentId}`);
      if (!studentData || studentData.error) {
        return res.status(200).json({ success: false, message: `❌ Student ID ${studentId} not found` });
      }
      const studentName = studentData.name || 'Unknown';
      await callFirebase('PUT', `/attendance/${date}/${studentId}`, { name: studentName });
      return res.status(200).json({ success: true, message: `✅ (${studentName}) marked present` });
    }

    if (req.method === 'DELETE') {
      await callFirebase('DELETE', `/attendance/${date}/${studentId}`);
      return res.status(200).json({ success: true, message: `Removed attendance of ${studentId} on ${date}.` });
    }
  }
  
  return res.status(405).send('Method Not Allowed');
}