const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PAINEL_URL = 'https://painel.magnohost.com.br';
const API_KEY = process.env.API_KEY; // vem do Render (Environment)
const SERVER_ID = '3b2bb7d0';

// Página de teste: abra a URL do Render no navegador
app.get('/', (req, res) => {
  res.send('Estou vivo!');
});
// ROTA DE TESTE (apagar depois)
app.get('/teste', async (req, res) => {
  try {
    await axios.post(
      `${PAINEL_URL}/api/client/servers/${SERVER_ID}/command`,
      { command: 'say Teste da ponte funcionando!' },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    res.send('Comando enviado! Olhe o chat do servidor.');
  } catch (err) {
    console.error('[ERRO NO TESTE]', err.response?.data || err.message);
    res.send('Deu erro. Veja os Logs do Render.');
  }
});
app.post('/webhook', async (req, res) => {
  const evento = req.body;
  console.log('Evento recebido da Tebex:', JSON.stringify(evento, null, 2));

  // Resposta que a Tebex exige na validação
  if (evento.type === 'validation.webhook') {
    return res.json({ id: evento.id });
  }

  // Responde rápido para a Tebex não dar timeout
  res.status(200).json({ status: 'received' });

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
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Ponte rodando na porta ${PORT}`));
