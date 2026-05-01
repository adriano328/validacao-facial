// src/i18n/livenessDisplayTextPtBR.ts
export const livenessDisplayTextPtBR = {
  // --- Start / tela inicial ---
  startScreenBeginCheckText: "Iniciar verificação de vídeo",

  // --- Hints (overlay do oval) ---
  hintCenterFaceText: "Centralize o rosto",
  hintCenterFaceInstructionText:
    "Instrução: antes de iniciar, posicione a câmera no topo/centro da tela e centralize seu rosto. Quando começar, um oval aparecerá no centro. Você será guiado para aproximar o rosto até o oval e, em seguida, ficar parado. Após alguns segundos parado, você ouvirá 'verificação concluída'.",

  hintMoveFaceFrontOfCameraText: "Coloque o rosto em frente à câmera",
  hintTooManyFacesText: "Mantenha apenas um rosto no enquadramento",
  hintFaceDetectedText: "Rosto detectado",
  hintCanNotIdentifyText: "Posicione o rosto em frente à câmera",

  hintTooCloseText: "Afaste um pouco",
  hintTooFarText: "Aproxime um pouco",

  hintFaceOffCenterText: "O rosto não está no oval. Centralize o rosto.",
  hintMatchIndicatorText: "50% concluído. Continue aproximando.",

  // ✅ ESTA É A CHAVE DO "Hold still"
  hintHoldFaceForFreshnessText: "Fique parado",

  // --- Iluminação ---
  hintIlluminationTooBrightText: "Ambiente muito claro. Vá para um local menos iluminado",
  hintIlluminationTooDarkText: "Ambiente escuro. Vá para um local mais iluminado",
  hintIlluminationNormalText: "Iluminação ok",

  // --- Verifying / uploading ---
  hintVerifyingText: "Verificando…",
  hintCheckCompleteText: "Verificação concluída",
  hintConnectingText: "Conectando…",

  // --- Fotosensibilidade ---
  photosensitivityWarningHeadingText: "Aviso de fotossensibilidade",
  photosensitivityWarningBodyText:
    "Esta verificação pode exibir luzes de cores diferentes. Tenha cuidado se você for fotossensível.",
  photosensitivityWarningInfoText:
    "Algumas pessoas podem ter crises ao serem expostas a luzes coloridas. Tenha cautela se você ou alguém da sua família tiver condição epiléptica.",
  photosensitivityWarningLabelText: "Mais informações sobre fotossensibilidade",

  // --- Camera / permissões ---
  waitingCameraPermissionText: "Aguardando você permitir o uso da câmera.",
  a11yVideoLabelText: "Câmera para verificação de vivacidade",

  cameraNotFoundHeadingText: "A câmera não está acessível.",
  cameraNotFoundMessageText:
    "Verifique se há uma câmera conectada e se nenhum outro app está usando a câmera. Talvez seja necessário permitir o acesso nas configurações e reiniciar o navegador.",

  cameraMinSpecificationsHeadingText: "A câmera não atende aos requisitos mínimos",
  cameraMinSpecificationsMessageText:
    "A câmera precisa suportar pelo menos 320x240 de resolução e 15 fps.",

  retryCameraPermissionsText: "Tentar novamente",

  // --- Stream / botões ---
  cancelLivenessCheckText: "Cancelar verificação",
  recordingIndicatorText: "Gravando",

  // --- Acessibilidade das imagens (opcional) ---
  goodFitCaptionText: "Bom enquadramento",
  tooFarCaptionText: "Muito longe",
  tooCloseCaptionText: "Muito perto",
};
