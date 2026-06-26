const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-content', async (req, res) => {
  const { bizName, bizType, bizCity, bizAbout, services } = req.body;

  if (!bizName || !services || !services.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt =
    'You are writing website copy for a small business. Write SHORT, punchy descriptions for each service listed below — 1-2 sentences max each, warm and specific to the business. Also write a catchy tagline (under 10 words) for the hero section.\n\n' +
    'Business Name: ' + bizName + '\n' +
    'Business Type: ' + bizType + '\n' +
    'Location: ' + bizCity + '\n' +
    'About: ' + (bizAbout || '') + '\n' +
    'Services: ' + services.join(', ') + '\n\n' +
    'Respond ONLY with valid JSON in this exact format, no markdown, no extra text:\n' +
    '{\n' +
    '  "tagline": "Your catchy tagline here",\n' +
    '  "descriptions": ["desc for service 1", "desc for service 2"]\n' +
    '}\n' +
    'Write exactly ' + services.length + ' descriptions, one per service in order.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(500).json({ error: 'API error', detail: data });
    }

    let text = (data.content && data.content[0] && data.content[0].text) || '';
    text = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    res.json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('InstaSite AI server running on port ' + PORT));
