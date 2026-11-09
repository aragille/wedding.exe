import type { Dict } from './en'

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export const ru: Dict = {
  meta: {
    title: 'WEDDING.EXE — Илья и Анна',
    description: 'Илья и Анна · 17.04.2027',
  },
  common: {
    language: 'Язык',
    progress: 'Прогресс',
    levels: ['СТАРТ', 'ИНВАЙТ', 'ОТВЕТ'],
    back: 'НАЗАД',
    sound: 'Звук',
  },
  start: {
    oneUp: '1UP',
    twoUp: '2UP',
    highScore: 'РЕКОРД',
    tagline: 'ДВА ИГРОКА. ОДИН БОЛЬШОЙ ДЕНЬ.',
    player1: 'ИГРОК 1',
    player2: 'ИГРОК 2',
    pressStart: 'НАЖМИТЕ СТАРТ',
    skipGame: 'ПРОПУСТИТЬ',
  },
  game: {
    title: 'НАЙДИТЕ ИГРОКА 2',
    instruction: 'Помогите Илье найти Анну.',
    controlsKeys: 'СТРЕЛКИ / WASD',
    controlsTouch: 'СВАЙП ИЛИ ТАП',
    hearts: 'СЕРДЦА',
    steps: 'ШАГИ',
    up: 'Вверх',
    down: 'Вниз',
    left: 'Влево',
    right: 'Вправо',
    boardLabel: 'Игровое поле. Стрелки или WASD двигают Илью.',
    position: (x, y, dist) => `Столбец ${x}, ряд ${y}. До Анны ${dist} ${plural(dist, 'шаг', 'шага', 'шагов')}.`,
    found: 'ИГРОК 2 НАЙДЕН',
    achievement: 'ДОСТИЖЕНИЕ ПОЛУЧЕНО',
    nextLevel: 'СЛЕДУЮЩИЙ УРОВЕНЬ: СВАДЬБА',
    continue: 'ДАЛЬШЕ',
  },
  invite: {
    and: 'И',
    married: 'ЖЕНЯТСЯ.',
    copy: 'Мы нашли своего второго игрока. Теперь хотим отпраздновать это вместе с вами.',
    dateLabel: 'ДАТА',
    venueLabel: 'МЕСТО',
    timeLabel: 'ВРЕМЯ',
    addressLabel: 'АДРЕС',
    dressLabel: 'ДРЕСС-КОД',
    deadlineLabel: 'ОТВЕТ ДО',
    cta: 'ПРИСОЕДИНИТЬСЯ',
    map: 'КАРТА',
  },
  rsvp: {
    title: 'ВЫ С НАМИ?',
    subtitle: 'Готовы присоединиться к празднику?',
    nameLabel: 'ИМЯ',
    namePlaceholder: 'Имя и фамилия',
    attendanceLabel: 'ПРИДЁТЕ?',
    yes: 'ДА, Я В ДЕЛЕ!',
    no: 'НЕ СМОГУ',
    partyLabel: 'ГОСТИ',
    partyHint: 'Включая вас',
    decrease: 'Меньше гостей',
    increase: 'Больше гостей',
    partyValue: (n) => `${n} ${plural(n, 'гость', 'гостя', 'гостей')}`,
    submit: 'ПОДТВЕРДИТЬ',
    submitting: 'СОХРАНЯЕМ…',
    errors: {
      nameRequired: 'Введите имя.',
      nameTooLong: 'Максимум 80 символов.',
      attendanceRequired: 'Выберите вариант.',
      partyRange: (max) => `От 1 до ${max} гостей.`,
      network: 'Не удалось сохранить. Попробуйте ещё раз.',
      server: 'Не удалось сохранить. Попробуйте ещё раз.',
      rateLimited: 'Слишком много попыток. Подождите минуту.',
      verification: 'Отметьте галочку выше и попробуйте снова.',
    },
    yesHeadline: 'ВЫ В СПИСКЕ!',
    yesCopy: 'Увидимся 17 апреля 2027 года.',
    noCopy: 'Спасибо, что дали знать. Будем скучать!',
    another: 'НОВЫЙ ОТВЕТ',
    mockNotice: 'ПРЕВЬЮ — НЕ СОХРАНЯЕТСЯ',
  },
}
