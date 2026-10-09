export type FactCategory =
  | 'Hidrata'
  | 'Come'
  | 'Entrena'
  | 'Recupera'
  | 'Descansa'
  | 'Hábitos'
  | 'Motivación'
  | 'Cuerpo';

export interface FitnessFact {
  title: string;
  body: string;
  category: FactCategory;
}

export const FITNESS_FACTS: FitnessFact[] = [
  { category: 'Hidrata', title: 'Bebe antes de tener sed', body: 'La sed ya es señal de que estás deshidratado. Toma agua durante todo el día, no solo cuando entrenas.' },
  { category: 'Hidrata', title: '2 litros al día es el mínimo', body: 'Como base, busca 2 litros de agua al día. Si entrenas fuerte o hace calor, sube a 3 o 4.' },
  { category: 'Hidrata', title: 'Lleva tu botella al gym', body: 'No esperes a llegar a casa para hidratarte. Tener la botella a la vista te recuerda beber más seguido.' },
  { category: 'Hidrata', title: 'La deshidratación roba fuerza', body: 'Bajar solo un 2% de agua corporal reduce tu rendimiento hasta un 20%. Un vaso antes de entrenar marca la diferencia.' },
  { category: 'Hidrata', title: 'Orina clara, bien hidratado', body: 'La orina amarilla concentrada es señal de falta de agua. La clara como el agua es tu mejor indicador.' },
  { category: 'Hidrata', title: '500 ml antes de entrenar', body: 'Tomar medio litro de agua 30 minutos antes del entreno mejora tu rendimiento y evita calambres.' },
  { category: 'Hidrata', title: 'Café y té cuentan', body: 'El café y el té aportan hidratación. No te prives de ellos pensando que deshidratan, en cantidades normales suman.' },
  { category: 'Hidrata', title: 'Repón después de entrenar', body: 'Por cada kilo de peso que pierdas sudando, toma 1.5 litros de agua en las siguientes horas.' },
  { category: 'Hidrata', title: 'El agua ayuda a la digestión', body: 'Beber agua con las comidas facilita la digestión y reduce la retención. No la tomes helada, mejor a temperatura ambiente.' },
  { category: 'Hidrata', title: 'No sustituyas con refrescos', body: 'Un refresco tiene el azúcar de 4 a 5 cucharaditas. El agua sola es siempre la mejor opción.' },

  { category: 'Come', title: 'No te saltes el desayuno', body: 'Después de 8 horas sin comer, tu cuerpo necesita energía. Un buen desayuno mejora tu rendimiento y tu humor.' },
  { category: 'Come', title: 'Proteína en cada comida', body: 'Reparte la proteína del día en 3 o 4 comidas. El cuerpo absorbe mejor 25-30 g por toma que 80 g de una sola vez.' },
  { category: 'Come', title: 'Una manzana antes del gym', body: 'Fruta 30 minutos antes de entrenar te da energía rápida sin pesadez. Plátano, manzana o dátiles funcionan.' },
  { category: 'Come', title: 'El atún, tu amigo rápido', body: 'Lata de atún, verduras y arroz: comida completa, barata y lista en 10 minutos. Ideal después de entrenar.' },
  { category: 'Come', title: 'Los huevos son el alimento perfecto', body: 'Tienen proteína de la más alta calidad, vitaminas y son baratos. 2 a 3 huevos al día es seguro y útil.' },
  { category: 'Come', title: 'No comas basura post-entreno', body: 'Tu cuerpo busca reponer lo gastado. Si lo llenas con papas fritas, pierdes el beneficio del entrenamiento.' },
  { category: 'Come', title: 'La avena es un gran desayuno', body: 'Energía sostenida, fibra y proteína. Cocínala con leche, frutas o frutos secos para un desayuno completo.' },
  { category: 'Come', title: 'El arroz blanco es tu amigo', body: 'Carbohidrato rápido, fácil de digerir y rinde mucho. Perfecto antes y después de entrenar.' },
  { category: 'Come', title: 'Cena ligero, desayuna fuerte', body: 'Cenas pesadas afectan el sueño. Come más temprano en el día y ligero en la noche.' },
  { category: 'Come', title: 'Una cheat meal no arruina nada', body: 'Comer pizza el sábado no borra 6 días de constancia. El balance semanal es lo que cuenta, no el día aislado.' },
  { category: 'Come', title: 'La fruta es postre, no sustituto', body: 'Fruta como postre después de comer es genial. Como sustituto de comida, te deja con hambre en una hora.' },
  { category: 'Come', title: 'Mastica bien', body: 'Masticar 20-30 veces cada bocado ayuda a digerir, reduces gases y te das cuenta de cuándo estás satisfecho.' },
  { category: 'Come', title: 'Cocinar en casa ahorra calorías', body: 'Un plato casero tiene 30-40% menos calorías que el mismo plato en restaurante. Cocinar es quererte.' },
  { category: 'Come', title: 'Frutos secos como snack', body: 'Un puñado de nueces o almendras te da proteína, grasa buena y energía. Cuidado con las versiones fritas y saladas.' },
  { category: 'Come', title: 'Evita las bebidas azucaradas', body: 'Jugo, refresco o bebida energética con azúcar son calorías líquidas vacías. Mejor agua, agua con limón o té.' },

  { category: 'Entrena', title: 'Calienta 5-10 minutos', body: 'Antes de levantar peso, camina en la caminadora, haz movilidad o haz un set ligero del ejercicio principal.' },
  { category: 'Entrena', title: 'Estira al final, no al inicio', body: 'Estiramientos estáticos antes de entrenar reducen tu fuerza. Mejor al final, cuando el músculo está caliente.' },
  { category: 'Entrena', title: 'No entrenes mismo músculo dos días seguidos', body: 'El músculo crece mientras descansas. Dale 48-72 horas al mismo grupo antes de trabajarlo otra vez.' },
  { category: 'Entrena', title: 'Más peso no es mejor', body: 'Levantar más peso del que puedes controlar con buena técnica solo te lleva a lesiones. Calidad > cantidad.' },
  { category: 'Entrena', title: 'La técnica va antes que el ego', body: 'No te compares con el de al lado. Si no puedes hacer el movimiento bien, baja el peso hasta poder.' },
  { category: 'Entrena', title: 'Si duele la articulación, para', body: 'Dolor muscular es normal, dolor en la articulación no. Si algo truena o duele en el hueso, descansa ese ejercicio.' },
  { category: 'Entrena', title: 'Empieza con poco peso', body: 'Tu primer mes no es para romper récords, es para aprender los patrones. Sube peso cada 1-2 semanas.' },
  { category: 'Entrena', title: 'El cardio no mata la ganancia', body: 'Hacer cardio moderado no te hace perder músculo. Lo que te hace perder es comer mal o no dormir.' },
  { category: 'Entrena', title: 'Caminar es el mejor cardio', body: '30-60 minutos de caminata diaria ayuda a quemar grasa, mejora el corazón y no te agota para el gym.' },
  { category: 'Entrena', title: 'Respira: exhala al esfuerzo', body: 'Inhala al bajar el peso, exhala al subirlo. Contener la respiración sube la presión arterial.' },
  { category: 'Entrena', title: 'Empieza con ejercicios compuestos', body: 'Sentadilla, peso muerto, press, remo, dominadas. Trabajan muchos músculos a la vez y dan mejores resultados.' },
  { category: 'Entrena', title: 'Termina con aislamiento', body: 'Curl de bíceps, elevación lateral, gemelos. Van al final, después de los movimientos grandes.' },
  { category: 'Entrena', title: 'Series de 8-12 son el sweet spot', body: 'Para ganar músculo, este rango de repeticiones es el más efectivo. Más bajo = fuerza, más alto = resistencia.' },
  { category: 'Entrena', title: 'Apunta tus pesos', body: 'Lo que no se mide no mejora. Anota en un papel o app lo que levantas cada día para ver tu progreso.' },
  { category: 'Entrena', title: '3 sesiones por semana alcanza', body: 'Para empezar, 3 entrenamientos de 45-60 minutos son suficientes. Más días no es mejor si los haces mal.' },

  { category: 'Recupera', title: 'Dormir bien es parte del entrenamiento', body: 'El músculo se repara mientras duermes. Si duermes mal, no creces igual aunque entrenes perfecto.' },
  { category: 'Recupera', title: 'Mínimo 7 horas de sueño', body: 'Menos de 6 horas afecta tu fuerza, tu coordinación y tu hambre. 7-8 es el rango ideal.' },
  { category: 'Recupera', title: 'El músculo crece descansando', body: 'En el gym solo lo rompes. La magia pasa en las horas siguientes, con comida y descanso.' },
  { category: 'Recupera', title: 'Un día de descanso no es perder tiempo', body: 'El cuerpo necesita recuperarse. Entrenar todos los días te lleva al sobreentrenamiento y al estancamiento.' },
  { category: 'Recupera', title: 'Estira al final del entreno', body: '5-10 minutos de estiramientos suaves después de entrenar mejora flexibilidad y reduce agujetas.' },
  { category: 'Recupera', title: 'Foam roller para soltar tensión', body: 'Pasar el rodillo por los músculos doloridos mejora circulación y reduce rigidez. No es mágico, pero ayuda.' },
  { category: 'Recupera', title: 'Baño caliente relaja', body: 'Después de un entreno duro, un baño caliente de 15-20 min relaja el músculo y mejora el descanso.' },
  { category: 'Recupera', title: 'El masaje no es lujo', body: 'Un masaje deportivo cada 2-4 semanas previene lesiones y mejora la recuperación. Es mantenimiento, no capricho.' },
  { category: 'Recupera', title: 'Si estás enfermo, descansa', body: 'Entrenar enfermo retrasa la recuperación. Si tienes fiebre, para. Si es un resfriado leve, ejercicio suave está bien.' },
  { category: 'Recupera', title: 'Una semana sin gym no se pierde', body: 'Volver después de 7 días no te atrasa. La memoria muscular dura semanas. Retoma con el 80% de tu peso normal.' },

  { category: 'Descansa', title: 'El sueño profundo repara', body: 'Es la fase donde tu cuerpo libera la hormona de crecimiento. Sin profundidad, no hay reparación real.' },
  { category: 'Descansa', title: 'Apaga pantallas 30 min antes', body: 'La luz de celular y tablet engaña al cerebro pensando que es de día. Lee un libro o conversa antes de dormir.' },
  { category: 'Descansa', title: 'Café después de las 4 pm', body: 'La cafeína tarda 6-8 horas en irse. Si tomas café a las 5 pm, a las 11 pm sigues despierto. Cuidado con eso.' },
  { category: 'Descansa', title: 'Habitación fresca duerme mejor', body: 'La temperatura ideal para dormir es entre 18 y 20 grados. Si hace calor, ventilá o prendé un ventilador.' },
  { category: 'Descansa', title: 'Dormir mal da más hambre', body: 'Una noche de mal sueño sube la grelina (hormona del hambre) y baja la leptina (saciedad). Dormir bien es parte de comer bien.' },
  { category: 'Descansa', title: 'La siesta de 20 min recarga', body: 'Una siesta corta después de comer renueva la energía. Más de 30 minutos entras en sueño profundo y es peor despertar.' },
  { category: 'Descansa', title: 'Misma hora de dormir', body: 'Tu cuerpo tiene reloj interno. Acostarte y levantarte a la misma hora, incluso fines de semana, mejora la calidad del sueño.' },
  { category: 'Descansa', title: 'La falta de sueño sube el cortisol', body: 'El cortisol alto acumula grasa abdominal y rompe músculo. Dormir bien no es opcional si quieres verte bien.' },

  { category: 'Hábitos', title: 'La constancia gana a la intensidad', body: 'Mejor 3 sesiones tranquilas a la semana por 5 años, que 6 heroicas por 2 meses y luego abandonar.' },
  { category: 'Hábitos', title: '3 sesiones por semana es mejor que 1 heroica', body: 'La frecuencia gana. Es preferible entrenar suave más veces que matarte un solo día.' },
  { category: 'Hábitos', title: 'No necesitas ser perfecto', body: 'Faltar un día, comer de más un rato, saltarte un ejercicio. No importa, lo importante es seguir la próxima vez.' },
  { category: 'Hábitos', title: 'El gym es tu cita, no la canceles', body: 'Como una reunión importante. Si la pones en el calendario y la respetas, irás. Si la dejas "para cuando pueda", no irás.' },
  { category: 'Hábitos', title: 'Un día malo no arruina tu semana', body: 'Perdiste el entreno, comiste mal, dormiste poco. Mañana es otro día. La semana completa es la que cuenta.' },
  { category: 'Hábitos', title: 'Hacerlo en casa también cuenta', body: 'Sin gym no es no entrenar. Bandas, peso corporal, una mochila con libros: 20 min en casa es mejor que cero.' },
  { category: 'Hábitos', title: '10 minutos es mejor que cero', body: '¿No tienes una hora? Haz 10 min. La más difícil es la primera, después la inercia te lleva a hacer más.' },
  { category: 'Hábitos', title: 'No te compares con el de al lado', body: 'Cada uno tiene su historia, su genética y su punto de partida. Tu única competencia eres tú de hace 3 meses.' },
  { category: 'Hábitos', title: 'Apunta tus pesos', body: 'Lo que se mide crece. Una libreta o app para anotar ejercicios, pesos y reps te muestra cuánto has avanzado.' },
  { category: 'Hábitos', title: 'Celebra las pequeñas victorias', body: 'Subir 2.5 kg en sentadilla, hacer una dominada más, no fallar en una semana. Cada mejora es un triunfo real.' },

  { category: 'Motivación', title: 'El progreso es invisible día a día', body: 'No vas a verte diferente mañana. Pero en 3 meses las fotos cuentan otra historia. Confía en el proceso.' },
  { category: 'Motivación', title: 'Tu cuerpo te lo agradecerá en 10 años', body: 'Entrenar hoy no es solo verte bien. Es tener huesos fuertes, corazón sano y energía cuando tengas 50.' },
  { category: 'Motivación', title: 'No entrenes para otros, entrena para ti', body: 'Las redes sociales mienten. Entrena para sentirte bien, no para impresionar a nadie.' },
  { category: 'Motivación', title: 'La versión más fuerte de ti ya existe', body: 'No la tienes que crear, solo la tienes que revelar. Cada día en el gym es descubrirla un poco más.' },
  { category: 'Motivación', title: 'Cada rep cuenta aunque sea suave', body: 'Un día de piernas cansadas no invalida el entrenamiento. Las series suaves suman volumen, también construyen.' },
  { category: 'Motivación', title: 'Las agujetas no son indicador', body: 'Puedes tener un gran entreno sin agujetas al día siguiente, y agujetas con un mal entreno. Lo que cuenta es el esfuerzo.' },
  { category: 'Motivación', title: 'Tu competencia eres tú de ayer', body: 'No compites con nadie más. La pregunta no es "qué puede hacer él", sino "qué puedo hacer yo hoy que ayer no".' },
  { category: 'Motivación', title: 'El gym no te hace agresivo, te enfoca', body: 'Después de entrenar, la cabeza queda más clara, el estrés baja y dormís mejor. Es terapia disfrazada de pesas.' },
  { category: 'Motivación', title: 'Después de entrenar te sientes mejor', body: 'No siempre las ganas están ahí. Pero después de terminar, siempre te sentís bien. Confía en esa sensación.' },
  { category: 'Motivación', title: 'La disciplina es hacer lo que hay que hacer', body: 'Cuando no tienes ganas, ese es el momento que cuenta. Los días fáciles no te construyen, los difíciles sí.' },

  { category: 'Cuerpo', title: 'El músculo pesa más que la grasa', body: 'Un kilo de músculo ocupa menos espacio que un kilo de grasa. Puedes bajar de peso y verte más grande al mismo tiempo.' },
  { category: 'Cuerpo', title: 'La báscula no dice todo', body: 'El peso fluctúa 1-2 kilos por día por agua y comida. Mejor medir cada 2 semanas en la misma condición.' },
  { category: 'Cuerpo', title: 'Una foto vale más que un peso', body: 'La báscula no distingue músculo de grasa. Las fotos de frente, lado y espalda cada 4 semanas son más útiles.' },
  { category: 'Cuerpo', title: 'El cuerpo cambia más por dentro al inicio', body: 'Las primeras semanas no se ven cambios afuera, pero por dentro tu cuerpo se está adaptando: corazón, pulmones, energía.' },
  { category: 'Cuerpo', title: 'Las agujetas no miden calidad', body: 'Puedes no tener nada de agujetas y haber entrenado perfecto. La progresión en peso y repeticiones es lo que cuenta.' },
  { category: 'Cuerpo', title: 'El músculo no se convierte en grasa', body: 'Son tejidos diferentes. Si dejás de entrenar, el músculo se atrofia y la grasa sube, pero una no se transforma en la otra.' },
  { category: 'Cuerpo', title: 'Las pesas no te hacen voluminosa', body: 'Ganar músculo lleva años de entrenamiento constante. Levantar peso te da tono, fuerza y mejor composición corporal.' },
  { category: 'Cuerpo', title: 'El hueso se fortalece con peso', body: 'El entrenamiento con pesas aumenta la densidad ósea y previene osteoporosis. Es mejor para tus huesos que correr.' },
  { category: 'Cuerpo', title: 'La flexibilidad se trabaja siempre', body: 'No importa la edad. Movilidad y flexibilidad se mantienen y mejoran con trabajo diario, aunque sea 5 minutos.' },
  { category: 'Cuerpo', title: 'El core es el centro de todo', body: 'Un core fuerte protege la espalda, mejora todos los levantamientos y te da mejor postura. Trabajalo siempre.' },
];

export function factOfDayIndex(date: Date = new Date()): number {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return dayOfYear % FITNESS_FACTS.length;
}
