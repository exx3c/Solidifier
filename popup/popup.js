// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
  
    document.getElementById('setStartTime').addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => document.querySelector('video').currentTime
        }, (results) => {
          const startTime = results[0].result;
          startTimeInput.value = formatTime(startTime);
        });
      });
    });
  
    document.getElementById('setEndTime').addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => document.querySelector('video').currentTime
        }, (results) => {
          const endTime = results[0].result;
          endTimeInput.value = formatTime(endTime);
        });
      });
    });
  
    document.getElementById('createFlashCard').addEventListener('click', () => {
      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;
  
      // Formata o link do embed do YouTube com os tempos de início e fim
      const videoId = extractVideoIdFromUrl(window.location.href);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}`;
  
      // Cria o código HTML do embed com ajuste automático
      const embedCode = `
        <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
          <iframe 
            src="${embedUrl}"
            style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      `;
  
      // Obtém a transcrição em inglês durante o intervalo de tempo
      getTranscription(startTime, endTime)
        .then(transcription => {
          // Exibe o código do flashcard completo (frente e verso) em um alerta
          const flashcardFront = `Front: ${embedCode}`;
          const flashcardBack = `Back: ${transcription}`;
          alert(`Código do Flashcard:\n\n${flashcardFront}\n\n${flashcardBack}`);
        })
        .catch(error => {
          alert('Erro ao obter transcrição:', error.message);
        });
    });
  
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
  
    function extractVideoIdFromUrl(url) {
      const match = url.match(/[?&]v=([^?&]+)/);
      return match ? match[1] : null;
    }
  
    async function getTranscription(startTime, endTime) {
      return new Promise((resolve, reject) => {
        // Tentar obter a transcrição das legendas de vídeo
        getAutomaticTranscription(videoId, startTime, endTime)
        .then(transcription => resolve(transcription))
        .catch(error => reject(error))
      });
    }
  
    function getSubtitlesTranscription(startTime, endTime) {
      // Exemplo simples de tentativa de obtenção de transcrição a partir das legendas de vídeo na página
      const subtitles = document.querySelectorAll('track[kind=subtitles][srclang=en]');
      if (subtitles.length > 0) {
        let transcription = '';
        subtitles.forEach(track => {
          if (track.track.mode === 'showing') {
            const cues = track.track.cues;
            for (let i = 0; i < cues.length; i++) {
              const cue = cues[i];
              if (cue.startTime >= startTime && cue.endTime <= endTime) {
                transcription += cue.text + ' ';
              }
            }
          }
        });
        if (transcription.trim() !== '') {
          return transcription.trim();
        }
      }
      return null;
    }
  
    function getAutomaticTranscription(videoId, startTime, endTime) {
      return new Promise((resolve, reject) => {
        // Exemplo simplificado de requisição para obter transcrição automática do YouTube
        fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3&start=${Math.floor(startTime)}&end=${Math.ceil(endTime)}`)
          .then(response => response.text())
          .then(data => {
            // Processar a resposta para extrair a transcrição
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, 'text/xml');
            const texts = xml.getElementsByTagName('text');
            let transcription = '';
            for (let i = 0; i < texts.length; i++) {
              const text = texts[i].textContent;
              transcription += text + ' ';
            }
            if (transcription.trim() !== '') {
              resolve(transcription.trim());
            } else {
              reject(new Error('Não foi possível obter transcrição automática.'));
            }
          })
          .catch(error => reject(error));
      });
    }
  });
  