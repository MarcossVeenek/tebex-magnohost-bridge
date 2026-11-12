const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAINEL_URL = 'https://painel.magnohost.com.br';
const API_KEY = 'ptlc_78yfVLqRppe8g2UICtCLejKkJpCpdxB3f5uMZPWtLh0';
const SERVER_ID = '3b2bb7d0';

app.all('/tebex-webhook', async (req, res) => {
  const evento = req.body;

  // Log para sabermos exatamente o que a Tebex está mandando no teste
  console.log('Recebido da Tebex:', req.method, JSON.stringify(evento));

  // Para qualquer teste de validação ou verificação inicial, respondemos com 200 OK imediatamente
  if (req.method === 'GET' || (evento && (evento.type === 'validation.webhook' || !evento.type))) {
    return res.status(200).send('Webhook received');
  }

  if (evento && evento.type === 'payment.completed') {
    const jogador = evento.subject?.customer?.username?.username || 'Player';
    const pacotes = evento.subject?.products || [];

    for (const item of pacotes) {
      let comando = '';
      if (item.name.toLowerCase().includes('vip')) {
        comando = `tag "${jogador}" add vip`;
      } else {
        comando = `give "${jogador}" diamond 10`;
      }

      try {
        await axios.post(
          `${PAINEL_URL}/api/client/servers/${SERVER_ID}/command`,
          { command: comando },
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        console.log(`[SUCESSO] Comando enviado para ${jogador}: ${comando}`);
      } catch (err) {
        console.error('[ERRO AO ENVIAR COMANDO]', err.response?.data || err.message);
      }
    }
  }

  return res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ponte rodando na porta ${PORT}`));
