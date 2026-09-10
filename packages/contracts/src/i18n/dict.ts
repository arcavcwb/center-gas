export type SupportedLang = 'pt' | 'es';

export interface TranslationSchema {
  banner: string;
  bannerTitle: string;
  bannerDesc: string;
  brand: string;
  brandSubtitle: string;
  help: string;
  heroGreeting: string;
  heroDesc: string;
  loadingTitle: string;
  loadingSubtitle: string;
  phoneTitle: string;
  phoneDesc: string;
  phonePlaceholder: string;
  phoneBtn: string;
  phoneVerifying: string;
  phoneError: string;
  connectionError: string;
  expiredSession: string;
  registerTitle: string;
  registerDesc: string;
  registerName: string;
  registerNamePlaceholder: string;
  registerCep: string;
  registerNeighborhood: string;
  registerNeighborhoodSelect: string;
  registerAddress: string;
  registerAddressPlaceholder: string;
  registerBtn: string;
  registerBtnLoading: string;
  fillAllFields: string;
  welcomeBack: string;
  yourAddress: string;
  loadingCatalog: string;
  badgeIncludesCylinder: string;
  descRefill: string;
  descFull: string;
  crossSellTitle: string;
  crossSellSubtitle: string;
  crossSellComboBadge: string;
  crossSellAdd: string;
  deliveryDataTitle: string;
  subtotalLabel: string;
  comboDiscountLabel: string;
  deliveryFeeLabel: string;
  totalLabel: string;
  paymentTitle: string;
  paymentCash: string;
  paymentPix: string;
  trocoTitle: string;
  trocoExact: string;
  trocoOption: string;
  submitOrderBtn: string;
  submittingOrder: string;
  emptyCartError: string;
  verifyPhoneAddressError: string;
  registerLinkRequiredError: string;
  orderLinkRequiredError: string;
  successTitle: string;
  successMessage: string;
  scheduledBannerTitle: string;
  scheduledBannerDesc: string;
  scheduledSlotBadge: string;
  scheduledOrderNotice: string;
  scheduledSuccessMessage: string;
  cylinderExchangeTip: string;
  deliveryNeighborhoodTip: string;
  offlineBanner: string;
  orderTrackingHint: string;
  changeAccount: string;
  verifiedPhoneBadge: string;
  changePhone: string;
  categoryAll: string;
  categoryGas: string;
  categoryWater: string;
  optionWithExchange: string;
  optionWithCylinder: string;
  tipExchangeRequired: string;
  tipNewCylinderIncluded: string;
  itemsInCartSummary: string;
}

export const translations: Record<SupportedLang, TranslationSchema> = {
  pt: {
    banner: "🚚 Entrega Rápida no Pinheirinho e região em até 30-45 min!",
    bannerTitle: "Entrega Expressa Pinheirinho",
    bannerDesc: "Gás de cozinha e água mineral no seu endereço em 30 a 45 minutos. Peça em segundos!",
    brand: "CENTER GÁS",
    brandSubtitle: "Distribuidora no Pinheirinho - Curitiba",
    help: "Ajuda WhatsApp",
    heroGreeting: "Gás de Cozinha e Água Mineral",
    heroDesc: "Atendimento ágil no Pinheirinho e bairros vizinhos. Faça seu pedido em segundos!",
    loadingTitle: "Identificando...",
    loadingSubtitle: "Um momento, estamos localizando seu cadastro.",
    phoneTitle: "Informe seu WhatsApp",
    phoneDesc: "Para agilizar sua entrega no seu endereço, informe seu número.",
    phonePlaceholder: "(41) 99999-9999",
    phoneBtn: "Continuar",
    phoneVerifying: "Verificando...",
    phoneError: "Por favor, informe um número de telefone válido.",
    connectionError: "Erro de conexão. Tente novamente.",
    expiredSession: "Link expirado ou inválido.",
    registerTitle: "Olá! É sua primeira vez na Center Gás",
    registerDesc: "Preencha seus dados para entrega no Pinheirinho e região.",
    registerName: "Nome ou Apelido",
    registerNamePlaceholder: "Ex: João Silva",
    registerCep: "CEP",
    registerNeighborhood: "Bairro",
    registerNeighborhoodSelect: "Selecione seu bairro...",
    registerAddress: "Endereço Completo",
    registerAddressPlaceholder: "Rua, Número, Apto/Bloco, Ponto de Referência...",
    registerBtn: "Salvar e Ver Produtos",
    registerBtnLoading: "Cadastrando...",
    fillAllFields: "Preencha todos os campos obrigatórios.",
    welcomeBack: "Olá, {name}!",
    yourAddress: "Seu endereço: {address}",
    loadingCatalog: "Carregando produtos...",
    badgeIncludesCylinder: "INCLUI BOTIJÃO NOVO",
    descRefill: "Você entrega o botijão/galão vazio ao entregador.",
    descFull: "Líquido + Vasilhame novo (não precisa ter vazio).",
    crossSellTitle: "Vai uma Água Mineral 20L?",
    crossSellSubtitle: "Leve {product} por apenas {price}",
    crossSellComboBadge: "Economize R$ 5,00 no Combo Gás + Água!",
    crossSellAdd: "+ Adicionar",
    deliveryDataTitle: "Dados de Entrega",
    subtotalLabel: "Subtotal dos produtos:",
    comboDiscountLabel: "Desconto Combo (Gás + Água):",
    deliveryFeeLabel: "Taxa de Entrega:",
    totalLabel: "Total a Pagar:",
    paymentTitle: "Forma de Pagamento",
    paymentCash: "Dinheiro na entrega",
    paymentPix: "PIX na entrega (chave ou maquininha)",
    trocoTitle: "Precisa de troco?",
    trocoExact: "Não, vou pagar valor exato ({amount})",
    trocoOption: "Troco para {amount} (Volta: {change})",
    submitOrderBtn: "FAZER PEDIDO AGORA ({amount})",
    submittingOrder: "Processando pedido...",
    emptyCartError: "O carrinho está vazio.",
    verifyPhoneAddressError: "Por favor, verifique seu telefone e endereço.",
    registerLinkRequiredError: "Este número já possui cadastro. Para atualizar seus dados, abra o link que enviamos no seu WhatsApp.",
    orderLinkRequiredError: "Para pedir com este número, abra o link que enviamos no seu WhatsApp.",
    successTitle: "Pedido Confirmado!",
    successMessage: "Seu pedido foi recebido e nossa equipe no Pinheirinho já está preparando a entrega. Entraremos em contato pelo WhatsApp!",
    scheduledBannerTitle: "Atendimento Fora de Horário Comercial",
    scheduledBannerDesc: "Nosso horário de entregas é das 08:00 às 20:00. Você pode pedir agora e sua entrega sairá amanhã a partir das 08:30!",
    scheduledSlotBadge: "Agendado para amanhã às 08:30",
    scheduledOrderNotice: "Pedido Fora de Horário: Entrega programada para amanhã às 08:30 no Pinheirinho.",
    scheduledSuccessMessage: "Recebemos seu pedido! Como estamos fora do horário de atendimento, ele já está agendado e sairá amanhã a partir das 08:30.",
    cylinderExchangeTip: "Requer botijão vazio na troca no ato da entrega.",
    deliveryNeighborhoodTip: "Taxa de entrega calculada conforme seu bairro em Curitiba.",
    offlineBanner: "Você está sem conexão com a internet. Verifique sua rede para concluir o pedido.",
    orderTrackingHint: "Acompanharemos seu pedido pelo WhatsApp até a chegada ao seu portão.",
    changeAccount: "Trocar de conta",
    verifiedPhoneBadge: "WhatsApp identificado",
    changePhone: "Corrigir número",
    categoryAll: "Todos",
    categoryGas: "Gás P13",
    categoryWater: "Água Mineral",
    optionWithExchange: "Já tenho o vazio",
    optionWithCylinder: "Comprar vasilhame novo",
    tipExchangeRequired: "Requer botijão/galão vazio na troca no ato da entrega.",
    tipNewCylinderIncluded: "Líquido + vasilhame novo. Não precisa ter vazio para troca.",
    itemsInCartSummary: "{refill}x recarga + {full}x com casco no pedido"
  },
  es: {
    banner: "Entrega Rápida en Pinheirinho y alrededores en 30-45 min!",
    bannerTitle: "Entrega Express Pinheirinho",
    bannerDesc: "Gas de cocina y agua mineral en tu dirección en 30 a 45 minutos. ¡Pide en segundos!",
    brand: "CENTER GÁS",
    brandSubtitle: "Distribuidora en Pinheirinho - Curitiba",
    help: "Ayuda WhatsApp",
    heroGreeting: "Gas de Cocina y Agua Mineral",
    heroDesc: "Atención ágil en Pinheirinho y barrios vecinos. ¡Haz tu pedido en segundos!",
    loadingTitle: "Identificándote...",
    loadingSubtitle: "Un momento, estamos buscando tu cuenta.",
    phoneTitle: "Ingresa tu WhatsApp",
    phoneDesc: "Para agilizar la entrega en tu dirección, ingresa tu número.",
    phonePlaceholder: "(41) 99999-9999",
    phoneBtn: "Continuar",
    phoneVerifying: "Verificando...",
    phoneError: "Por favor ingresa un número de teléfono válido.",
    connectionError: "Error de conexión. Intenta de nuevo.",
    expiredSession: "Enlace expirado o inválido.",
    registerTitle: "¡Hola! Es tu primera vez en Center Gás",
    registerDesc: "Completa tus datos para entrega en Pinheirinho y alrededores.",
    registerName: "Nombre o Apodo",
    registerNamePlaceholder: "Ej: João Silva",
    registerCep: "CEP",
    registerNeighborhood: "Barrio",
    registerNeighborhoodSelect: "Selecciona tu barrio...",
    registerAddress: "Dirección Exacta",
    registerAddressPlaceholder: "Rua, Número, Referencia...",
    registerBtn: "Guardar y Ver Catálogo",
    registerBtnLoading: "Registrando...",
    fillAllFields: "Completa todos los campos obligatorios.",
    welcomeBack: "¡Hola, {name}!",
    yourAddress: "Tu dirección: {address}",
    loadingCatalog: "Cargando catálogo...",
    badgeIncludesCylinder: "INCLUYE ENVASE NUEVO",
    descRefill: "Debes entregar un envase vacío al motoboy.",
    descFull: "Líquido + Casco Plástico (no necesitas vacío).",
    crossSellTitle: "¿Deseas agregar agua mineral 20L?",
    crossSellSubtitle: "Lleva {product} por solo {price}",
    crossSellComboBadge: "¡Ahorra R$ 5,00 con el Combo Gás + Água!",
    crossSellAdd: "+ Agregar",
    deliveryDataTitle: "Datos de Entrega",
    subtotalLabel: "Subtotal productos:",
    comboDiscountLabel: "Descuento Combo (Gás + Água):",
    deliveryFeeLabel: "Tasa de Entrega:",
    totalLabel: "Total a Pagar:",
    paymentTitle: "Forma de Pago",
    paymentCash: "Efectivo al recibir",
    paymentPix: "PIX en la entrega",
    trocoTitle: "¿Necesitas vuelto (Troco)?",
    trocoExact: "No, pagaré el monto exacto ({amount})",
    trocoOption: "Troco para {amount} (Vuelto: {change})",
    submitOrderBtn: "PEDIR AHORA ({amount})",
    submittingOrder: "Procesando pedido...",
    emptyCartError: "El carrito está vacío.",
    verifyPhoneAddressError: "Por favor verifica tu teléfono y dirección.",
    registerLinkRequiredError: "Este número ya tiene registro. Para actualizar tus datos, abre el enlace que te enviamos por WhatsApp.",
    orderLinkRequiredError: "Para pedir con este número, abre el enlace que te enviamos por WhatsApp.",
    successTitle: "¡Pedido Confirmado!",
    successMessage: "Tu pedido ha sido recibido y nuestro equipo en Pinheirinho ya lo está preparando. Te contactaremos por WhatsApp.",
    scheduledBannerTitle: "Atención Fuera de Horario Comercial",
    scheduledBannerDesc: "Nuestro horario de entrega es de 08:00 a 20:00. ¡Puedes pedir ahora y tu entrega saldrá mañana a partir de las 08:30!",
    scheduledSlotBadge: "Agendado para mañana a las 08:30",
    scheduledOrderNotice: "Pedido Fuera de Horario: Entrega programada para mañana a las 08:30 en Pinheirinho.",
    scheduledSuccessMessage: "¡Recibimos tu pedido! Como estamos fuera de horario comercial, ya está programado y saldrá mañana a partir de las 08:30.",
    cylinderExchangeTip: "Requiere cilindro vacío a cambio al momento de la entrega.",
    deliveryNeighborhoodTip: "Tarifa de entrega calculada según tu barrio en Curitiba.",
    offlineBanner: "Estás sin conexión a internet. Verifica tu red para completar el pedido.",
    orderTrackingHint: "Acompañaremos tu pedido por WhatsApp hasta la llegada a tu portón.",
    changeAccount: "Cambiar de cuenta",
    verifiedPhoneBadge: "WhatsApp identificado",
    changePhone: "Corregir número",
    categoryAll: "Todos",
    categoryGas: "Gas P13",
    categoryWater: "Agua Mineral",
    optionWithExchange: "Tengo envase vacío",
    optionWithCylinder: "Comprar envase nuevo",
    tipExchangeRequired: "Requiere envase vacío para el intercambio al recibir.",
    tipNewCylinderIncluded: "Líquido + envase nuevo. No necesitas vacío para intercambio.",
    itemsInCartSummary: "{refill}x recarga + {full}x con casco en el pedido"
  }
};
