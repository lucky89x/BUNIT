/* ENGLISH QUEST - Từ vựng
 * Mỗi từ: id, en (tiếng Anh), vi (nghĩa), e (biểu tượng), ex/exVi (câu ví dụ), t (chủ đề), r (vùng)
 * pic:false  -> không dùng cho câu hỏi "chọn hình" (hình chưa đủ rõ nghĩa)
 * sw         -> ô màu (dùng cho từ chỉ màu sắc thay vì biểu tượng)
 * pl         -> dạng số nhiều (nếu là danh từ)
 * Muốn thêm từ: thêm 1 dòng W(...) đúng mẫu, gắn vào bài học trong quests.js (teach.words).
 */
window.EQ = window.EQ || {};
(function () {
  const list = [];
  function W(id, en, vi, e, ex, exVi, t, r, extra) {
    list.push(Object.assign({ id, en, vi, e, ex, exVi, t, r, pic: true }, extra || {}));
  }

  // ===== VÙNG 1: STARTER VILLAGE =====
  // Chào hỏi
  W('hello', 'hello', 'xin chào', '👋', 'Hello! I am Lily.', 'Xin chào! Mình là Lily.', 'greet', 'village', { pic: false });
  W('hi', 'hi', 'chào (thân mật)', '🙋', 'Hi, Tom!', 'Chào Tom!', 'greet', 'village', { pic: false });
  W('goodbye', 'goodbye', 'tạm biệt', '👋', 'Goodbye, see you later!', 'Tạm biệt, hẹn gặp lại nhé!', 'greet', 'village', { pic: false });
  W('good_morning', 'good morning', 'chào buổi sáng', '🌅', 'Good morning, teacher!', 'Chúng em chào cô buổi sáng ạ!', 'greet', 'village', { pic: false });
  W('thank_you', 'thank you', 'cảm ơn', '🙏', 'Thank you very much!', 'Cảm ơn bạn rất nhiều!', 'greet', 'village', { pic: false });
  W('sorry', 'sorry', 'xin lỗi', '😔', 'Sorry, I am late.', 'Xin lỗi, mình đến muộn.', 'greet', 'village', { pic: false });
  W('yes', 'yes', 'vâng, có, đúng', '✅', 'Yes, it is a cat.', 'Đúng, nó là một con mèo.', 'greet', 'village', { pic: false });
  W('no', 'no', 'không', '❌', 'No, it is not a dog.', 'Không, nó không phải là con chó.', 'greet', 'village', { pic: false });
  W('name', 'name', 'tên', '🏷️', 'My name is Anna.', 'Tên mình là Anna.', 'greet', 'village', { pic: false, pl: 'names' });
  W('friend', 'friend', 'bạn, bạn bè', '🤝', 'Lily is my friend.', 'Lily là bạn của mình.', 'greet', 'village', { pic: false, pl: 'friends' });
  W('nice_meet', 'nice to meet you', 'rất vui được gặp bạn', '😊', 'Hello, Tom. Nice to meet you!', 'Chào Tom. Rất vui được gặp bạn!', 'greet', 'village', { pic: false });

  // Số đếm (hiển thị bằng chữ số)
  const nums = [
    ['one', 'một', '1', 'I have one bag.', 'Mình có một cái cặp.'],
    ['two', 'hai', '2', 'I have two eyes.', 'Mình có hai mắt.'],
    ['three', 'ba', '3', 'Find three red apples.', 'Hãy tìm ba quả táo đỏ.'],
    ['four', 'bốn', '4', 'A cat has four legs.', 'Con mèo có bốn chân.'],
    ['five', 'năm', '5', 'I have five pens.', 'Mình có năm cái bút.'],
    ['six', 'sáu', '6', 'I wake up at six.', 'Mình thức dậy lúc sáu giờ.'],
    ['seven', 'bảy', '7', 'There are seven days in a week.', 'Một tuần có bảy ngày.'],
    ['eight', 'tám', '8', 'My brother is eight.', 'Em trai mình tám tuổi.'],
    ['nine', 'chín', '9', 'I go to bed at nine.', 'Mình đi ngủ lúc chín giờ.'],
    ['ten', 'mười', '10', 'I have ten fingers.', 'Mình có mười ngón tay.'],
    ['eleven', 'mười một', '11', 'I am eleven.', 'Mình mười một tuổi.'],
    ['twelve', 'mười hai', '12', 'My sister is twelve.', 'Chị gái mình mười hai tuổi.'],
    ['thirteen', 'mười ba', '13', 'I am thirteen.', 'Mình mười ba tuổi.'],
    ['fourteen', 'mười bốn', '14', 'My friend is fourteen.', 'Bạn mình mười bốn tuổi.'],
    ['fifteen', 'mười lăm', '15', 'My brother is fifteen.', 'Anh trai mình mười lăm tuổi.']
  ];
  nums.forEach(n => W(n[0], n[0], n[1], n[2], n[3], n[4], 'number', 'village', { num: true }));

  // Màu sắc (sw = mã màu hiển thị)
  W('red', 'red', 'màu đỏ', '🔴', 'The apple is red.', 'Quả táo màu đỏ.', 'color', 'village', { sw: '#e53935' });
  W('blue', 'blue', 'màu xanh dương', '🔵', 'The sky is blue.', 'Bầu trời màu xanh dương.', 'color', 'village', { sw: '#1e88e5' });
  W('green', 'green', 'màu xanh lá', '🟢', 'The tree is green.', 'Cái cây màu xanh lá.', 'color', 'village', { sw: '#43a047' });
  W('yellow', 'yellow', 'màu vàng', '🟡', 'The banana is yellow.', 'Quả chuối màu vàng.', 'color', 'village', { sw: '#fdd835' });
  W('black', 'black', 'màu đen', '⚫', 'My cat is black.', 'Con mèo của mình màu đen.', 'color', 'village', { sw: '#212121' });
  W('white', 'white', 'màu trắng', '⚪', 'The rabbit is white.', 'Con thỏ màu trắng.', 'color', 'village', { sw: '#fafafa' });
  W('orange', 'orange', 'màu cam', '🟠', 'I have an orange bag.', 'Mình có một cái cặp màu cam.', 'color', 'village', { sw: '#fb8c00' });
  W('pink', 'pink', 'màu hồng', '🌸', 'Her dress is pink.', 'Váy của cô ấy màu hồng.', 'color', 'village', { sw: '#f48fb1' });
  W('purple', 'purple', 'màu tím', '🟣', 'I like purple.', 'Mình thích màu tím.', 'color', 'village', { sw: '#8e24aa' });
  W('brown', 'brown', 'màu nâu', '🟤', 'The bear is brown.', 'Con gấu màu nâu.', 'color', 'village', { sw: '#795548' });

  // Đồ vật
  W('book', 'book', 'quyển sách', '📖', 'This is my book.', 'Đây là quyển sách của mình.', 'object', 'village', { pl: 'books' });
  W('pen', 'pen', 'cái bút (bút mực)', '🖊️', 'I have a blue pen.', 'Mình có một cái bút màu xanh dương.', 'object', 'village', { pl: 'pens' });
  W('bag', 'bag', 'cái cặp, cái túi', '🎒', 'My bag is red.', 'Cặp của mình màu đỏ.', 'object', 'village', { pl: 'bags' });
  W('chair', 'chair', 'cái ghế', '🪑', 'Sit on the chair, please.', 'Mời bạn ngồi lên ghế.', 'object', 'village', { pl: 'chairs' });
  W('table', 'table', 'cái bàn', '🍽️', 'The book is on the table.', 'Quyển sách ở trên bàn.', 'object', 'village', { pl: 'tables', pic: false });
  W('door', 'door', 'cửa ra vào', '🚪', 'Open the door, please.', 'Làm ơn mở cửa ra.', 'object', 'village', { pl: 'doors' });
  W('key', 'key', 'chìa khóa', '🔑', 'This is a magic key.', 'Đây là một chiếc chìa khóa thần kỳ.', 'object', 'village', { pl: 'keys' });
  W('ball', 'ball', 'quả bóng', '⚽', 'The ball is blue.', 'Quả bóng màu xanh dương.', 'object', 'village', { pl: 'balls' });
  W('box', 'box', 'cái hộp', '📦', 'The cat is in the box.', 'Con mèo ở trong cái hộp.', 'object', 'village', { pl: 'boxes' });
  W('cup', 'cup', 'cái cốc', '☕', 'This is my cup.', 'Đây là cái cốc của mình.', 'object', 'village', { pl: 'cups' });
  W('hat', 'hat', 'cái mũ', '👒', 'I have a pink hat.', 'Mình có một cái mũ màu hồng.', 'object', 'village', { pl: 'hats' });
  W('umbrella', 'umbrella', 'cái ô (dù)', '☂️', 'It is an umbrella.', 'Đó là một cái ô.', 'object', 'village', { pl: 'umbrellas' });
  W('house', 'house', 'ngôi nhà', '🏠', 'This is my house.', 'Đây là nhà của mình.', 'object', 'village', { pl: 'houses' });
  W('clock', 'clock', 'đồng hồ (treo tường)', '🕰️', 'The clock is on the wall.', 'Đồng hồ ở trên tường.', 'object', 'village', { pl: 'clocks' });

  // Con vật trong làng
  W('cat', 'cat', 'con mèo', '🐱', 'This is a cat.', 'Đây là một con mèo.', 'animal', 'village', { pl: 'cats' });
  W('dog', 'dog', 'con chó', '🐶', 'My dog is brown.', 'Con chó của mình màu nâu.', 'animal', 'village', { pl: 'dogs' });

  // Đồ ăn trong làng
  W('apple', 'apple', 'quả táo', '🍎', 'I like apples.', 'Mình thích táo.', 'food', 'village', { pl: 'apples' });
  W('egg', 'egg', 'quả trứng', '🥚', 'I have two eggs.', 'Mình có hai quả trứng.', 'food', 'village', { pl: 'eggs' });
  W('water', 'water', 'nước', '💧', 'I drink water.', 'Mình uống nước.', 'food', 'village');
  W('milk', 'milk', 'sữa', '🥛', 'I drink milk every morning.', 'Mình uống sữa mỗi sáng.', 'food', 'village');
  W('bread', 'bread', 'bánh mì', '🍞', 'I eat bread for breakfast.', 'Mình ăn bánh mì vào bữa sáng.', 'food', 'village');
  W('cake', 'cake', 'bánh ngọt, bánh kem', '🎂', 'This cake is for you!', 'Cái bánh này dành cho bạn!', 'food', 'village', { pl: 'cakes' });

  // ===== VÙNG 2: MAGIC FOREST =====
  // Gia đình
  W('family', 'family', 'gia đình', '👪', 'I love my family.', 'Mình yêu gia đình của mình.', 'family', 'forest', { pl: 'families', pic: false });
  W('mother', 'mother', 'mẹ', '👩', 'This is my mother.', 'Đây là mẹ của mình.', 'family', 'forest', { pl: 'mothers' });
  W('father', 'father', 'bố', '👨', 'My father is a doctor.', 'Bố mình là bác sĩ.', 'family', 'forest', { pl: 'fathers' });
  W('sister', 'sister', 'chị gái, em gái', '👧', 'She is my sister.', 'Bạn ấy là chị gái (em gái) của mình.', 'family', 'forest', { pl: 'sisters' });
  W('brother', 'brother', 'anh trai, em trai', '👦', 'He is my brother.', 'Bạn ấy là anh trai (em trai) của mình.', 'family', 'forest', { pl: 'brothers' });
  W('grandmother', 'grandmother', 'bà', '👵', 'My grandmother is kind.', 'Bà của mình rất hiền.', 'family', 'forest', { pl: 'grandmothers' });
  W('grandfather', 'grandfather', 'ông', '👴', 'My grandfather has white hair.', 'Ông của mình có mái tóc bạc trắng.', 'family', 'forest', { pl: 'grandfathers' });
  W('baby', 'baby', 'em bé', '👶', 'The baby is small.', 'Em bé nhỏ xíu.', 'family', 'forest', { pl: 'babies' });

  // Con vật trong rừng
  W('bird', 'bird', 'con chim', '🐦', 'The bird can fly.', 'Con chim có thể bay.', 'animal', 'forest', { pl: 'birds' });
  W('fish', 'fish', 'con cá', '🐟', 'The fish can swim.', 'Con cá có thể bơi.', 'animal', 'forest', { pl: 'fish' });
  W('rabbit', 'rabbit', 'con thỏ', '🐰', 'The rabbit has long ears.', 'Con thỏ có đôi tai dài.', 'animal', 'forest', { pl: 'rabbits' });
  W('bear', 'bear', 'con gấu', '🐻', 'The bear is big.', 'Con gấu thì to.', 'animal', 'forest', { pl: 'bears' });
  W('duck', 'duck', 'con vịt', '🦆', 'The duck can swim.', 'Con vịt có thể bơi.', 'animal', 'forest', { pl: 'ducks' });
  W('cow', 'cow', 'con bò', '🐮', 'The cow gives us milk.', 'Con bò cho chúng ta sữa.', 'animal', 'forest', { pl: 'cows' });
  W('pig', 'pig', 'con lợn (con heo)', '🐷', 'The pig is pink.', 'Con lợn màu hồng.', 'animal', 'forest', { pl: 'pigs' });
  W('horse', 'horse', 'con ngựa', '🐴', 'The horse can run fast.', 'Con ngựa có thể chạy nhanh.', 'animal', 'forest', { pl: 'horses' });
  W('monkey', 'monkey', 'con khỉ', '🐵', 'The monkey likes bananas.', 'Con khỉ thích chuối.', 'animal', 'forest', { pl: 'monkeys' });
  W('elephant', 'elephant', 'con voi', '🐘', 'The elephant is very big.', 'Con voi rất to.', 'animal', 'forest', { pl: 'elephants' });
  W('tiger', 'tiger', 'con hổ', '🐯', 'The tiger is orange and black.', 'Con hổ có màu cam và đen.', 'animal', 'forest', { pl: 'tigers' });
  W('owl', 'owl', 'con cú', '🦉', 'The owl can see at night.', 'Con cú có thể nhìn thấy vào ban đêm.', 'animal', 'forest', { pl: 'owls' });

  // Đồ ăn trong rừng
  W('banana', 'banana', 'quả chuối', '🍌', 'Monkeys like bananas.', 'Những chú khỉ thích chuối.', 'food', 'forest', { pl: 'bananas' });
  W('orange_fruit', 'orange', 'quả cam', '🍊', 'I eat an orange.', 'Mình ăn một quả cam.', 'food', 'forest', { pl: 'oranges' });
  W('rice', 'rice', 'cơm, gạo', '🍚', 'We eat rice every day.', 'Chúng mình ăn cơm mỗi ngày.', 'food', 'forest');
  W('chicken', 'chicken', 'thịt gà', '🍗', 'I like chicken.', 'Mình thích thịt gà.', 'food', 'forest');
  W('carrot', 'carrot', 'củ cà rốt', '🥕', 'Rabbits like carrots.', 'Những chú thỏ thích cà rốt.', 'food', 'forest', { pl: 'carrots' });
  W('noodles', 'noodles', 'mì, phở, bún (sợi)', '🍜', 'I eat noodles for breakfast.', 'Mình ăn phở (mì) vào bữa sáng.', 'food', 'forest');
  W('ice_cream', 'ice cream', 'kem (ăn)', '🍦', 'I love ice cream!', 'Mình rất thích kem!', 'food', 'forest');
  W('tea', 'tea', 'trà', '🍵', 'My grandfather drinks tea.', 'Ông mình uống trà.', 'food', 'forest');

  // Trường học
  W('school', 'school', 'trường học', '🏫', 'I go to school every day.', 'Mình đi học mỗi ngày.', 'school', 'forest', { pl: 'schools' });
  W('teacher', 'teacher', 'giáo viên', '👩‍🏫', 'My teacher is nice.', 'Cô giáo của mình rất tốt.', 'school', 'forest', { pl: 'teachers' });
  W('student', 'student', 'học sinh', '👨‍🎓', 'I am a student.', 'Mình là học sinh.', 'school', 'forest', { pl: 'students' });
  W('classroom', 'classroom', 'lớp học (phòng học)', '🚸', 'Our classroom is big.', 'Lớp học của chúng mình rộng.', 'school', 'forest', { pl: 'classrooms', pic: false });
  W('pencil', 'pencil', 'bút chì', '✏️', 'I write with a pencil.', 'Mình viết bằng bút chì.', 'school', 'forest', { pl: 'pencils' });
  W('ruler', 'ruler', 'thước kẻ', '📏', 'This is my ruler.', 'Đây là thước kẻ của mình.', 'school', 'forest', { pl: 'rulers' });
  W('notebook', 'notebook', 'quyển vở', '📓', 'Write in your notebook.', 'Hãy viết vào vở của em.', 'school', 'forest', { pl: 'notebooks' });
  W('scissors', 'scissors', 'cái kéo', '✂️', 'The scissors are on the desk.', 'Cái kéo ở trên bàn học.', 'school', 'forest');
  W('crayon', 'crayon', 'bút sáp màu', '🖍️', 'I have a red crayon.', 'Mình có một cây bút sáp màu đỏ.', 'school', 'forest', { pl: 'crayons' });

  // Bộ phận cơ thể
  W('head', 'head', 'cái đầu', '🙆', 'Touch your head.', 'Hãy chạm vào đầu của bạn.', 'body', 'forest', { pl: 'heads', pic: false });
  W('eye', 'eye', 'con mắt', '👁️', 'I have two eyes.', 'Mình có hai mắt.', 'body', 'forest', { pl: 'eyes' });
  W('ear', 'ear', 'cái tai', '👂', 'I have two ears.', 'Mình có hai tai.', 'body', 'forest', { pl: 'ears' });
  W('nose', 'nose', 'cái mũi', '👃', 'Touch your nose.', 'Hãy chạm vào mũi của bạn.', 'body', 'forest', { pl: 'noses' });
  W('mouth', 'mouth', 'cái miệng', '👄', 'Open your mouth.', 'Hãy mở miệng ra.', 'body', 'forest', { pl: 'mouths' });
  W('hand', 'hand', 'bàn tay', '✋', 'Raise your hand.', 'Hãy giơ tay lên.', 'body', 'forest', { pl: 'hands' });
  W('arm', 'arm', 'cánh tay', '💪', 'I have two arms.', 'Mình có hai cánh tay.', 'body', 'forest', { pl: 'arms' });
  W('leg', 'leg', 'cái chân (cẳng chân)', '🦵', 'A dog has four legs.', 'Con chó có bốn chân.', 'body', 'forest', { pl: 'legs' });
  W('foot', 'foot', 'bàn chân', '🦶', 'My foot is cold.', 'Bàn chân của mình bị lạnh.', 'body', 'forest', { pl: 'feet' });
  W('tooth', 'tooth', 'cái răng', '🦷', 'Brush your teeth.', 'Hãy đánh răng.', 'body', 'forest', { pl: 'teeth' });
  W('hair', 'hair', 'tóc', '💇', 'She has long hair.', 'Cô ấy có mái tóc dài.', 'body', 'forest', { pic: false });

  // Hoạt động hằng ngày
  W('eat', 'eat', 'ăn', '😋', 'I eat rice.', 'Mình ăn cơm.', 'action', 'forest');
  W('drink', 'drink', 'uống', '🥤', 'I drink water.', 'Mình uống nước.', 'action', 'forest');
  W('sleep', 'sleep', 'ngủ', '😴', 'I sleep at nine.', 'Mình ngủ lúc chín giờ.', 'action', 'forest');
  W('read', 'read', 'đọc', '📚', 'I read books.', 'Mình đọc sách.', 'action', 'forest');
  W('write', 'write', 'viết', '✍️', 'I write my name.', 'Mình viết tên của mình.', 'action', 'forest');
  W('play', 'play', 'chơi', '🤹', 'I play with my friends.', 'Mình chơi với các bạn.', 'action', 'forest');
  W('run', 'run', 'chạy', '🏃', 'I run in the park.', 'Mình chạy trong công viên.', 'action', 'forest');
  W('swim', 'swim', 'bơi', '🏊', 'I swim in the river.', 'Mình bơi ở dưới sông.', 'action', 'forest');
  W('cook', 'cook', 'nấu ăn', '🍳', 'My mother cooks dinner.', 'Mẹ mình nấu bữa tối.', 'action', 'forest');
  W('wake_up', 'wake up', 'thức dậy', '⏰', 'I wake up at six.', 'Mình thức dậy lúc sáu giờ.', 'action', 'forest');
  W('watch_tv', 'watch TV', 'xem ti vi', '📺', 'I watch TV in the evening.', 'Mình xem ti vi vào buổi tối.', 'action', 'forest');

  // ===== VÙNG 3: GRAMMAR CASTLE =====
  W('like', 'like', 'thích', '❤️', 'I like cats.', 'Mình thích mèo.', 'ability', 'castle', { pic: false });
  W('live', 'live', 'sống', '🏡', 'I live in a small house.', 'Mình sống trong một ngôi nhà nhỏ.', 'ability', 'castle', { pic: false });
  W('sing', 'sing', 'hát', '🎤', 'She can sing well.', 'Cô ấy có thể hát hay.', 'ability', 'castle');
  W('dance', 'dance', 'nhảy múa', '💃', 'I can dance.', 'Mình có thể nhảy múa.', 'ability', 'castle');
  W('jump', 'jump', 'nhảy lên, bật nhảy', '🦘', 'Rabbits can jump.', 'Những chú thỏ có thể bật nhảy.', 'ability', 'castle');
  W('fly', 'fly', 'bay', '🕊️', 'Birds can fly.', 'Chim có thể bay.', 'ability', 'castle');
  W('climb', 'climb', 'leo, trèo', '🧗', 'Monkeys can climb trees.', 'Khỉ có thể trèo cây.', 'ability', 'castle');
  W('draw', 'draw', 'vẽ', '🎨', 'I can draw a cat.', 'Mình có thể vẽ một con mèo.', 'ability', 'castle');
  W('walk', 'walk', 'đi bộ', '🚶', 'I walk to school.', 'Mình đi bộ đến trường.', 'ability', 'castle');
  W('speak', 'speak', 'nói', '🗣️', 'I can speak English.', 'Mình có thể nói tiếng Anh.', 'ability', 'castle');

  // Giới từ vị trí
  W('in', 'in', 'ở trong', '📥', 'The cat is in the box.', 'Con mèo ở trong cái hộp.', 'prep', 'castle', { pic: false });
  W('on', 'on', 'ở trên (chạm bề mặt)', '⬆️', 'The book is on the table.', 'Quyển sách ở trên bàn.', 'prep', 'castle', { pic: false });
  W('under', 'under', 'ở dưới', '⬇️', 'The ball is under the chair.', 'Quả bóng ở dưới ghế.', 'prep', 'castle', { pic: false });
  W('next_to', 'next to', 'ở bên cạnh', '↔️', 'The dog is next to the door.', 'Con chó ở bên cạnh cửa.', 'prep', 'castle', { pic: false });
  W('behind', 'behind', 'ở phía sau', '🔙', 'The cat is behind the box.', 'Con mèo ở phía sau cái hộp.', 'prep', 'castle', { pic: false });
  W('in_front_of', 'in front of', 'ở phía trước', '🔜', 'The dog is in front of the house.', 'Con chó ở phía trước ngôi nhà.', 'prep', 'castle', { pic: false });

  // Lâu đài
  W('castle', 'castle', 'lâu đài', '🏰', 'The castle is very big.', 'Lâu đài rất to.', 'castle', 'castle', { pl: 'castles' });
  W('prince', 'prince', 'hoàng tử', '🤴', 'The prince can ride a horse.', 'Hoàng tử có thể cưỡi ngựa.', 'castle', 'castle', { pl: 'princes' });
  W('princess', 'princess', 'công chúa', '👸', 'The princess is kind.', 'Công chúa rất tốt bụng.', 'castle', 'castle', { pl: 'princesses' });
  W('crown', 'crown', 'vương miện', '👑', 'The princess has a gold crown.', 'Công chúa có một chiếc vương miện bằng vàng.', 'castle', 'castle', { pl: 'crowns' });
  W('guard', 'guard', 'lính gác', '💂', 'The guard is tall.', 'Người lính gác thì cao.', 'castle', 'castle', { pl: 'guards' });
  W('bed', 'bed', 'cái giường', '🛏️', 'The cat is under the bed.', 'Con mèo ở dưới gầm giường.', 'castle', 'castle', { pl: 'beds' });
  W('room', 'room', 'căn phòng', '🚪', 'This is my room.', 'Đây là phòng của mình.', 'castle', 'castle', { pl: 'rooms', pic: false });

  EQ.VOCAB = list;
  EQ.V = {};
  list.forEach(w => { EQ.V[w.id] = w; });

  EQ.TOPICS = {
    greet: 'Chào hỏi', number: 'Số đếm', color: 'Màu sắc', object: 'Đồ vật', animal: 'Con vật',
    food: 'Đồ ăn, thức uống', family: 'Gia đình', school: 'Trường học', body: 'Cơ thể',
    action: 'Hoạt động hằng ngày', ability: 'Động từ, khả năng', prep: 'Giới từ vị trí', castle: 'Lâu đài',
    grammar: 'Ngữ pháp', listen: 'Nghe hiểu', order: 'Sắp xếp câu'
  };
})();
