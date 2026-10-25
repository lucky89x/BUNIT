/* ENGLISH QUEST - Nhiệm vụ, hội thoại, trùm, vật phẩm, trang phục, huy hiệu
 *
 * Hội thoại (mảng các "nút"):
 *   { s:'npc', en, vi }           NPC nói (có nút nghe, nút xem nghĩa)
 *   { s:'pip', vi }               Tinh linh Pip nói tiếng Việt (dẫn truyện, gợi ý)
 *   { s:'me', en, vi }            Nhân vật chính nói
 *   { ask, vi, opts:[{en, ok, why}], build, pic, topic }
 *        Người chơi chọn câu trả lời. ok:true = đúng. why = giải thích khi chọn sai.
 *        build: (tùy chọn) khi độ khó cao, người chơi phải tự ghép câu này.
 * {name} sẽ được thay bằng tên nhân vật.
 *
 * Các bước nhiệm vụ (stages):
 *   talk    – nói chuyện với npc (script)
 *   collect – nhặt đồ trên bản đồ (count)
 *   gate    – mở cổng phép thuật (gate)
 *   chest   – mở rương (chest)
 *   quiz    – thử thách tại NPC (gen = cách tạo câu hỏi)
 *   shop    – nhiệm vụ đi chợ (list)
 *   boss    – đánh trùm (boss)
 */
window.EQ = window.EQ || {};
(function () {
  const Q = [];
  function quest(o) { Q.push(o); }

  // ====================== VÙNG 1: LÀNG KHỞI ĐẦU ======================
  quest({
    id: 'v_hello', region: 'village', title: 'Lời chào đầu tiên', giver: 'chief', requires: [],
    summary: 'Chào hỏi Trưởng làng Tom và giới thiệu bản thân.',
    teach: { lesson: 'greet', words: ['hello', 'hi', 'goodbye', 'name', 'nice_meet', 'thank_you', 'yes', 'no'] },
    intro: [
      { s: 'pip', vi: 'Kia là Trưởng làng Tom! Ông ấy chỉ còn nhớ được vài câu tiếng Anh thôi. Mình học cách chào hỏi trước nhé!' }
    ],
    stages: [{
      type: 'talk', npc: 'chief', obj: 'Nói chuyện với Trưởng làng Tom',
      script: [
        { s: 'npc', en: 'Hello! I am Tom.', vi: 'Xin chào! Ông là Tom.' },
        { ask: "What's your name?", vi: 'Cháu tên là gì?', topic: 'greet', build: 'My name is {name}.',
          opts: [
            { en: 'My name is {name}.', ok: true },
            { en: 'I name is {name}.', why: 'Phải nói "My name is ..." (Tên của tôi là...).' },
            { en: 'Goodbye, Tom.', why: '"Goodbye" là lời tạm biệt, không phải để nói tên.' }
          ] },
        { s: 'npc', en: 'Nice to meet you, {name}!', vi: 'Rất vui được gặp cháu, {name}!' },
        { ask: 'How old are you?', vi: 'Cháu bao nhiêu tuổi?', topic: 'greet', age: true,
          opts: [
            { en: 'I am {age}.', ok: true },
            { en: 'I have {age} years.', why: 'Tiếng Anh nói tuổi bằng "I am + số tuổi". Không dùng "have" như tiếng Việt "có ... tuổi".' },
            { en: 'My name is {age}.', why: '"My name is" dùng để nói tên, không phải tuổi.' }
          ] },
        { s: 'npc', en: 'Our village is sad. A bad king took our magic stones.', vi: 'Làng ta đang buồn lắm. Một ông vua xấu đã lấy mất những viên đá phép thuật.' },
        { ask: 'Can you help us?', vi: 'Cháu có thể giúp chúng ta không?', topic: 'greet',
          opts: [
            { en: 'Yes!', ok: true },
            { en: 'Goodbye!', why: 'Ôi, đừng đi! Hãy trả lời "Yes!" (Có!) để giúp làng nhé.' }
          ] },
        { s: 'npc', en: 'Thank you, {name}! Take this map.', vi: 'Cảm ơn cháu, {name}! Hãy cầm tấm bản đồ này.' },
        { s: 'pip', vi: 'Tuyệt vời! Bạn vừa nói những câu tiếng Anh đầu tiên. Bấm phím M để xem bản đồ nhé. Những người có dấu ❗ trên đầu đang cần giúp đỡ!' }
      ]
    }],
    reward: { xp: 30, gold: 10, items: { map: 1 } }
  });

  quest({
    id: 'v_apples', region: 'village', title: 'Táo đỏ cho bà Rose', giver: 'rose', requires: ['v_hello'],
    summary: 'Tìm ba quả táo đỏ trong vườn táo cho bà Rose.',
    teach: { words: ['apple', 'red', 'green', 'yellow', 'one', 'two', 'three'] },
    intro: [
      { s: 'npc', en: 'Hello, dear! I am Granny Rose.', vi: 'Chào cháu yêu! Bà là bà Rose.' },
      { s: 'npc', en: 'I want to make a cake.', vi: 'Bà muốn làm một cái bánh.' },
      { s: 'npc', en: 'Find three red apples, please.', vi: 'Cháu hãy tìm giúp bà ba quả táo đỏ nhé.' },
      { s: 'pip', vi: 'Vườn táo ở phía đông nam làng. Nhớ nhé: "red" là màu đỏ, "three" là số ba. Đến gần quả táo rồi bấm E để nhặt.' }
    ],
    stages: [
      { type: 'collect', count: 3, obj: 'Tìm ba quả táo đỏ (three red apples)', objEn: 'Find three red apples.' },
      { type: 'talk', npc: 'rose', obj: 'Mang táo về cho bà Rose', script: [
        { s: 'npc', en: 'One, two, three red apples!', vi: 'Một, hai, ba quả táo đỏ!' },
        { ask: 'What color are the apples?', vi: 'Những quả táo màu gì?', topic: 'color',
          opts: [
            { en: 'They are red.', ok: true },
            { en: 'They are green.', why: 'Bạn đã nhặt táo màu đỏ (red) mà! "green" là màu xanh lá.' },
            { en: 'They are blue.', why: '"blue" là màu xanh dương. Táo của bà Rose màu đỏ (red).' }
          ] },
        { s: 'npc', en: 'Thank you! This apple pie is for you.', vi: 'Cảm ơn cháu! Cái bánh táo này là của cháu.' },
        { s: 'pip', vi: 'Bánh táo 🥧 giúp hồi lại 2 trái tim khi chiến đấu đấy!' }
      ] }
    ],
    reward: { xp: 30, gold: 15, items: { pie: 2 } }
  });

  quest({
    id: 'v_cat', region: 'village', title: 'Chú mèo đi lạc của Lily', giver: 'lily', requires: ['v_hello'],
    summary: 'Giúp Lily tìm con mèo màu đen.',
    teach: { lesson: 'this', words: ['cat', 'dog', 'black', 'white', 'orange', 'blue', 'pink', 'purple', 'brown', 'friend'] },
    intro: [
      { s: 'npc', en: "Hi! I'm Lily.", vi: 'Chào bạn! Mình là Lily.' },
      { ask: "What's your name?", vi: 'Bạn tên là gì?', topic: 'greet', build: 'My name is {name}.',
        opts: [
          { en: "I'm {name}.", ok: true },
          { en: 'Name {name}.', why: 'Hãy nói thành câu đầy đủ: "I\'m {name}." hoặc "My name is {name}."' },
          { en: 'Thank you.', why: '"Thank you" là cảm ơn. Lily đang hỏi tên bạn.' }
        ] },
      { s: 'npc', en: "I am sad. I can't find my cat.", vi: 'Mình buồn lắm. Mình không tìm thấy con mèo của mình.' },
      { s: 'npc', en: 'My cat is black. It is small.', vi: 'Con mèo của mình màu đen. Nó nhỏ xíu.' },
      { s: 'pip', vi: 'Trong làng có vài con mèo. Hãy tìm con mèo màu đen (black) nhé!' }
    ],
    stages: [
      { type: 'collect', count: 1, obj: 'Tìm con mèo màu đen (the black cat)', objEn: 'Find the black cat.' },
      { type: 'talk', npc: 'lily', obj: 'Đưa mèo về cho Lily', script: [
        { s: 'npc', en: 'Yes! This is my cat!', vi: 'Đúng rồi! Đây là con mèo của mình!' },
        { ask: "What color is Lily's cat?", vi: 'Con mèo của Lily màu gì?', topic: 'color', build: 'It is black.',
          opts: [
            { en: 'It is black.', ok: true },
            { en: 'It are black.', why: '"It" đi với "is": It is black.' },
            { en: 'It is white.', why: '"white" là màu trắng. Mèo của Lily màu đen (black).' }
          ] },
        { ask: 'Is it a cat or a dog?', vi: 'Nó là con mèo hay con chó?', topic: 'animal',
          opts: [
            { en: 'It is a cat.', ok: true },
            { en: 'It is an cat.', why: '"cat" bắt đầu bằng phụ âm nên dùng "a": a cat.' },
            { en: 'It is a dog.', why: '"dog" là con chó. Đây là con mèo (cat).' }
          ] },
        { s: 'npc', en: 'Thank you! You are my friend. Take my pink ribbon!', vi: 'Cảm ơn bạn! Bạn là bạn của mình. Tặng bạn chiếc nơ hồng!' }
      ] }
    ],
    reward: { xp: 35, gold: 15, outfit: 'pink' }
  });

  quest({
    id: 'v_gate', region: 'village', title: 'Cánh cổng nhà kho', giver: 'chief', requires: ['v_hello'],
    summary: 'Mở cánh cổng phép thuật của nhà kho để lấy Đũa phép Ngôn ngữ.',
    teach: { lesson: 'tobe', words: ['house', 'door', 'chair', 'table', 'clock', 'pen'] },
    intro: [
      { s: 'npc', en: 'The magic wand is in the storehouse.', vi: 'Cây đũa phép ở trong nhà kho.' },
      { s: 'npc', en: 'But the gate is locked.', vi: 'Nhưng cánh cổng đã bị khóa.' },
      { s: 'pip', vi: 'Cổng này được khóa bằng phép thuật "am – is – are". Mình học trước rồi đến cổng ở phía đông bắc làng nhé!' }
    ],
    stages: [
      { type: 'gate', gate: 'storeGate', obj: 'Mở cổng nhà kho (phía đông bắc)' },
      { type: 'chest', chest: 'wandChest', obj: 'Mở rương lấy Đũa phép' },
      { type: 'talk', npc: 'chief', obj: 'Báo tin cho Trưởng làng Tom', script: [
        { s: 'npc', en: 'You have the magic wand!', vi: 'Cháu đã có cây đũa phép rồi!' },
        { s: 'npc', en: 'Be careful. The slimes are naughty.', vi: 'Cẩn thận nhé. Lũ slime rất nghịch ngợm.' },
        { s: 'pip', vi: 'Với đũa phép, bạn có thể dùng tiếng Anh để hóa giải lũ quái vật. Trả lời đúng = tung phép thuật! Trả lời sai cũng không sao, mình sẽ giải thích.' }
      ] }
    ],
    reward: { xp: 40, gold: 10 }
  });

  quest({
    id: 'v_market', region: 'village', title: 'Đi chợ giúp Minh', giver: 'minh', requires: ['v_apples'],
    summary: 'Mua đồ theo danh sách tiếng Anh ở cửa hàng chú Ben.',
    teach: { words: ['egg', 'water', 'milk', 'bread', 'cake', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] },
    intro: [
      { s: 'npc', en: 'Hello! I am Minh.', vi: 'Xin chào! Mình là Minh.' },
      { s: 'npc', en: 'My mom is sick. Can you go to the shop for me?', vi: 'Mẹ mình bị ốm. Bạn đi chợ giúp mình được không?' },
      { s: 'npc', en: 'Here is my list and ten coins.', vi: 'Đây là danh sách và mười đồng xu.' },
      { s: 'pip', vi: 'Cửa hàng của chú Ben ở khu chợ phía tây. Đọc kỹ danh sách tiếng Anh rồi chọn đúng số lượng nhé!' }
    ],
    stages: [
      { type: 'shop', npc: 'ben', list: { egg: 3, apple: 2, water: 1 }, budget: 10, obj: 'Mua đồ ở cửa hàng chú Ben' },
      { type: 'talk', npc: 'minh', obj: 'Mang đồ về cho Minh', script: [
        { s: 'npc', en: 'Three eggs, two apples and one bottle of water. Great!', vi: 'Ba quả trứng, hai quả táo và một chai nước. Tuyệt quá!' },
        { ask: 'How many eggs?', vi: 'Có bao nhiêu quả trứng?', topic: 'number',
          opts: [
            { en: 'Three eggs.', ok: true },
            { en: 'Three egg.', why: 'Từ hai trở lên phải dùng số nhiều: three eggs.' },
            { en: 'Two eggs.', why: '"two" là hai. Bạn đã mua ba (three) quả trứng.' }
          ] },
        { s: 'npc', en: 'Thank you, {name}! My mom says thank you too.', vi: 'Cảm ơn bạn, {name}! Mẹ mình cũng cảm ơn bạn.' }
      ] }
    ],
    reward: { xp: 40, gold: 20, badge: 'shopper' }
  });

  quest({
    id: 'v_treasure', region: 'village', title: 'Kho báu bên hồ', giver: 'sam', requires: ['v_gate'],
    summary: 'Mở chiếc rương bí ẩn bên hồ bằng cách nghe và chọn đúng hình.',
    teach: { words: ['key', 'box', 'ball', 'book', 'bag', 'hat', 'cup', 'umbrella'] },
    intro: [
      { s: 'npc', en: 'Hello! I am Sam. I like fish.', vi: 'Chào cháu! Bác là Sam. Bác thích cá.' },
      { s: 'npc', en: 'I have a treasure box. But I cannot open it.', vi: 'Bác có một chiếc rương kho báu. Nhưng bác không mở được.' },
      { s: 'pip', vi: 'Rương có "khóa âm thanh": hãy nghe từ tiếng Anh rồi chọn hình đúng. Rương ở ngay cạnh bác Sam.' }
    ],
    stages: [
      { type: 'chest', chest: 'pondChest', obj: 'Mở rương kho báu bên hồ' },
      { type: 'talk', npc: 'sam', obj: 'Nói chuyện với bác Sam', script: [
        { s: 'npc', en: 'Wow! You are very good at English!', vi: 'Chà! Cháu giỏi tiếng Anh quá!' },
        { s: 'npc', en: 'Take this sailor hat. Goodbye!', vi: 'Tặng cháu chiếc mũ thủy thủ này. Tạm biệt!' }
      ] }
    ],
    reward: { xp: 40, gold: 10, outfit: 'sailor' }
  });

  quest({
    id: 'v_boss', region: 'village', title: 'Vua Slime Ục Ịch', giver: 'slimeKing', requires: ['v_apples', 'v_cat', 'v_gate', 'v_market'],
    summary: 'Hóa giải Vua Slime ở cổng phía đông và lấy lại Viên Đá Lời Chào.',
    teach: { words: ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'] },
    intro: [
      { s: 'npc', en: 'Blub blub! I am the Slime King!', vi: 'Bùm bụp! Ta là Vua Slime!' },
      { s: 'npc', en: 'The Red Stone is mine!', vi: 'Viên Đá Đỏ là của ta!' },
      { s: 'pip', vi: 'Trước trận đấu, học thêm các số từ 11 đến 15 nhé. Sau đó dùng tất cả những gì bạn đã học ở làng: chào hỏi, số đếm, màu sắc, đồ vật và am/is/are!' }
    ],
    stages: [
      { type: 'boss', boss: 'slimeKing', obj: 'Hóa giải Vua Slime ở cổng phía đông' },
      { type: 'talk', npc: 'chief', obj: 'Báo tin vui cho Trưởng làng Tom', script: [
        { s: 'npc', en: 'You have the Red Stone! Thank you!', vi: 'Cháu đã lấy lại Viên Đá Đỏ! Cảm ơn cháu!' },
        { s: 'npc', en: 'Now people can say hello again.', vi: 'Giờ mọi người lại có thể chào nhau rồi.' },
        { s: 'pip', vi: 'Con đường sang Rừng Từ Vựng đã mở! Ở đó có 1 viên đá nữa đang chờ bạn.' }
      ] }
    ],
    reward: { xp: 100, gold: 40, items: { stone_red: 1 }, badge: 'boss1', outfit: 'hero' }
  });

  // ====================== VÙNG 2: RỪNG TỪ VỰNG ======================
  quest({
    id: 'f_family', region: 'forest', title: 'Tấm ảnh gia đình', giver: 'anna', requires: ['v_boss'],
    summary: 'Anna cho bạn xem ảnh gia đình. Hãy nói đúng từng người là ai.',
    teach: { lesson: 'hesh', words: ['family', 'mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby'] },
    intro: [
      { s: 'npc', en: 'Hello! Welcome to the Magic Forest.', vi: 'Xin chào! Chào mừng bạn đến Rừng Phép Thuật.' },
      { s: 'npc', en: 'This is a photo of my family.', vi: 'Đây là tấm ảnh gia đình mình.' }
    ],
    stages: [{
      type: 'talk', npc: 'anna', obj: 'Xem ảnh gia đình cùng Anna', script: [
        { ask: 'Who is he?', vi: 'Ông ấy là ai?', pic: '👴', topic: 'family', build: 'He is your grandfather.',
          opts: [
            { en: 'He is your grandfather.', ok: true },
            { en: 'She is your grandfather.', why: 'Ông là đàn ông nên dùng "He", không dùng "She".' },
            { en: 'He is your grandmother.', why: '"grandmother" là bà. Đây là ông (grandfather).' }
          ] },
        { ask: 'Who is she?', vi: 'Cô ấy là ai?', pic: '👩', topic: 'family', build: 'She is your mother.',
          opts: [
            { en: 'She is your mother.', ok: true },
            { en: 'He is your mother.', why: 'Mẹ là phụ nữ nên dùng "She".' },
            { en: 'She is your father.', why: '"father" là bố. Đây là mẹ (mother).' }
          ] },
        { ask: 'And who is he?', vi: 'Còn bạn ấy là ai?', pic: '👦', topic: 'family',
          opts: [
            { en: 'He is your brother.', ok: true },
            { en: 'He is your sister.', why: '"sister" là chị/em gái. Đây là anh/em trai (brother).' },
            { en: 'He are your brother.', why: '"He" đi với "is", không đi với "are".' }
          ] },
        { ask: 'Who is this?', vi: 'Đây là ai?', pic: '👶', topic: 'family',
          opts: [
            { en: 'This is the baby.', ok: true },
            { en: 'This is the grandfather.', why: '"grandfather" là ông. Đây là em bé (baby).' }
          ] },
        { s: 'npc', en: 'Yes! I love my family.', vi: 'Đúng rồi! Mình yêu gia đình mình lắm.' },
        { s: 'npc', en: 'Take this green cloak. It is for forest heroes!', vi: 'Tặng bạn chiếc áo choàng xanh này. Nó dành cho những anh hùng của khu rừng!' }
      ]
    }],
    reward: { xp: 40, gold: 15, outfit: 'ranger' }
  });

  quest({
    id: 'f_lunch', region: 'forest', title: 'Bữa trưa của bác Gấu', giver: 'bear', requires: ['v_boss'],
    summary: 'Tìm hai quả chuối và một con cá cho bác Gấu.',
    teach: { lesson: 'plural', words: ['banana', 'fish', 'carrot', 'rice', 'chicken', 'orange_fruit', 'noodles', 'ice_cream', 'tea'] },
    intro: [
      { s: 'npc', en: 'Hello! I am a bear. I am hungry!', vi: 'Xin chào! Ta là gấu. Ta đói bụng quá!' },
      { s: 'npc', en: 'Please find two bananas and one fish.', vi: 'Hãy tìm giúp ta hai quả chuối và một con cá.' },
      { s: 'pip', vi: '"two bananas" – có hai thì thêm -s. "one fish" – một con cá. Chuối ở phía nam, cá ở bãi cát bên sông.' }
    ],
    stages: [
      { type: 'collect', need: { banana: 2, fish: 1 }, obj: 'Tìm 2 quả chuối và 1 con cá', objEn: 'Find two bananas and one fish.' },
      { type: 'talk', npc: 'bear', obj: 'Mang đồ ăn về cho bác Gấu', script: [
        { s: 'npc', en: 'Yummy! Thank you!', vi: 'Ngon quá! Cảm ơn cháu!' },
        { ask: 'How many bananas do I have?', vi: 'Ta có bao nhiêu quả chuối?', topic: 'food',
          opts: [
            { en: 'Two bananas.', ok: true },
            { en: 'Two banana.', why: 'Có "two" thì danh từ phải thêm -s: two bananas.' },
            { en: 'Three bananas.', why: '"three" là ba. Bạn mang về hai (two) quả.' }
          ] },
        { s: 'npc', en: 'I like fish and bananas. Do you like fish?', vi: 'Ta thích cá và chuối. Cháu có thích cá không?' },
        { s: 'me', en: 'Yes, I like fish!', vi: 'Có, cháu thích cá!' }
      ] }
    ],
    reward: { xp: 40, gold: 15, items: { pie: 1 } }
  });

  quest({
    id: 'f_school', region: 'forest', title: 'Lớp học của cô Cú', giver: 'owl', requires: ['v_boss'],
    summary: 'Học đồ dùng học tập và sắp xếp từ thành câu.',
    teach: { lesson: 'order', words: ['school', 'teacher', 'student', 'classroom', 'pencil', 'ruler', 'notebook', 'scissors', 'crayon', 'good_morning', 'sorry'] },
    intro: [
      { s: 'npc', en: 'Good morning! I am a teacher.', vi: 'Chào buổi sáng! Cô là giáo viên.' },
      { s: 'npc', en: 'Lord Silence took the words from my books!', vi: 'Chúa tể Im Lặng đã lấy mất chữ trong sách của cô!' },
      { s: 'npc', en: 'Please put the words in order.', vi: 'Em hãy sắp xếp lại các từ nhé.' }
    ],
    stages: [
      { type: 'quiz', npc: 'owl', obj: 'Làm bài với cô Cú', title: 'Lớp học trong rừng',
        gen: { words: { list: ['pencil', 'ruler', 'notebook', 'scissors', 'crayon', 'teacher', 'student', 'school'], n: 3 }, order: { lessons: ['order', 'tobe', 'have', 'this'], n: 3 } },
        script: [
          { s: 'npc', en: 'Very good! You are a good student.', vi: 'Rất tốt! Em là một học sinh giỏi.' },
          { s: 'npc', en: 'Take this magic book.', vi: 'Hãy cầm quyển sách phép thuật này.' },
          { s: 'pip', vi: 'Sách phép thuật 📘 giúp phép của bạn mạnh hơn: mỗi câu đúng gây thêm sát thương!' }
        ] }
    ],
    reward: { xp: 50, gold: 15, items: { spellbook: 1 } }
  });

  quest({
    id: 'f_bridge', region: 'forest', title: 'Cây cầu của ông Rùa', giver: 'turtle', requires: ['f_family', 'f_lunch'],
    summary: 'Giúp ông Rùa sửa cây cầu bằng have/has và số nhiều.',
    teach: { lesson: 'have', words: ['bird', 'rabbit', 'bear', 'duck', 'cow', 'pig', 'horse', 'monkey', 'elephant', 'tiger', 'owl'] },
    intro: [
      { s: 'npc', en: 'Hello. I am an old turtle.', vi: 'Chào cháu. Ta là một ông rùa già.' },
      { s: 'npc', en: 'The bridge is broken. I have wood, but I need magic words.', vi: 'Cây cầu bị hỏng rồi. Ta có gỗ, nhưng ta cần những từ phép thuật.' },
      { s: 'npc', en: 'Many animals want to cross the bridge.', vi: 'Rất nhiều con vật muốn đi qua cầu.' },
      { s: 'pip', vi: 'Hãy dùng "have / has" và số nhiều để sửa cây cầu nhé!' }
    ],
    stages: [
      { type: 'gate', gate: 'bridgeGate', obj: 'Sửa cây cầu (giữa rừng)' },
      { type: 'talk', npc: 'turtle', obj: 'Cảm ơn ông Rùa', script: [
        { s: 'npc', en: 'The bridge is strong now. Thank you!', vi: 'Cây cầu chắc chắn rồi. Cảm ơn cháu!' },
        { s: 'npc', en: 'Doctor Giraffe and Momo live on the other side.', vi: 'Bác sĩ Hươu và khỉ Momo sống ở bên kia cầu.' }
      ] }
    ],
    reward: { xp: 50, gold: 20 }
  });

  quest({
    id: 'f_doctor', region: 'forest', title: 'Phòng khám của Bác sĩ Hươu', giver: 'giraffe', requires: ['f_bridge'],
    summary: 'Giúp Bác sĩ Hươu khám bệnh: nhận biết các bộ phận cơ thể.',
    teach: { words: ['head', 'eye', 'ear', 'nose', 'mouth', 'hand', 'arm', 'leg', 'foot', 'tooth', 'hair'] },
    intro: [
      { s: 'npc', en: 'Hello! I am Doctor Giraffe.', vi: 'Xin chào! Ta là Bác sĩ Hươu.' },
      { s: 'npc', en: 'My little patients forget their body words. Can you help?', vi: 'Những bệnh nhân nhỏ của ta quên hết tên các bộ phận cơ thể. Cháu giúp ta nhé?' }
    ],
    stages: [
      { type: 'quiz', npc: 'giraffe', obj: 'Giúp Bác sĩ Hươu khám bệnh', title: 'Phòng khám trong rừng',
        gen: { words: { topic: 'body', n: 5 }, grammar: { lessons: ['plural'], n: 1 } },
        script: [
          { s: 'npc', en: 'Great job, Doctor {name}!', vi: 'Làm tốt lắm, Bác sĩ {name}!' },
          { s: 'npc', en: 'Brush your teeth every day!', vi: 'Hãy đánh răng mỗi ngày nhé!' }
        ] }
    ],
    reward: { xp: 50, gold: 20, items: { pie: 1 }, outfit: 'doctor' }
  });

  quest({
    id: 'f_momo', region: 'forest', title: 'Trò đoán chữ của Momo', giver: 'momo', requires: ['f_bridge'],
    summary: 'Chơi trò đoán hoạt động hằng ngày với khỉ con Momo.',
    teach: { words: ['eat', 'drink', 'sleep', 'read', 'write', 'play', 'run', 'swim', 'cook', 'wake_up', 'watch_tv'] },
    intro: [
      { s: 'npc', en: 'Hi! I am Momo. I like games!', vi: 'Chào! Tớ là Momo. Tớ thích chơi trò chơi!' },
      { s: 'npc', en: 'Look at the picture and guess the word!', vi: 'Nhìn hình và đoán từ nhé!' }
    ],
    stages: [
      { type: 'quiz', npc: 'momo', obj: 'Chơi đoán chữ với Momo', title: 'Đoán hoạt động',
        gen: { words: { topic: 'action', n: 6 } },
        script: [
          { s: 'npc', en: 'You are so smart! Every day I eat bananas and I play with my friends.', vi: 'Bạn thông minh quá! Mỗi ngày tớ ăn chuối và chơi với các bạn.' },
          { s: 'npc', en: 'Here are some coins. Bye!', vi: 'Tặng bạn ít xu này. Tạm biệt!' }
        ] }
    ],
    reward: { xp: 45, gold: 30 }
  });

  quest({
    id: 'f_boss', region: 'forest', title: 'Vua Nấm Cáu Kỉnh', giver: 'mushKing', requires: ['f_family', 'f_lunch', 'f_school', 'f_bridge', 'f_doctor'],
    summary: 'Hóa giải Vua Nấm ở cuối rừng và lấy lại Viên Đá Từ Vựng.',
    intro: [
      { s: 'npc', en: 'Go away! The Green Stone is mine!', vi: 'Đi đi! Viên Đá Xanh là của ta!' },
      { s: 'pip', vi: 'Vua Nấm biết rất nhiều từ vựng: gia đình, con vật, đồ ăn, trường học, cơ thể... Cố lên!' }
    ],
    stages: [
      { type: 'boss', boss: 'mushKing', obj: 'Hóa giải Vua Nấm ở cuối rừng (phía đông)' },
      { type: 'talk', npc: 'anna', obj: 'Kể cho Anna nghe chuyện lạ', script: [
        { s: 'npc', en: 'You have the Green Stone! Wow!', vi: 'Bạn lấy lại được Viên Đá Xanh rồi! Ôi!' },
        { s: 'pip', vi: 'Lúc tỉnh lại, Vua Nấm nói một điều kỳ lạ: "Chúa tể Im Lặng... trước kia là người thủ thư của Lâu Đài..."' },
        { s: 'npc', en: 'The castle is in the east. Be careful!', vi: 'Lâu đài ở phía đông. Bạn cẩn thận nhé!' }
      ] }
    ],
    reward: { xp: 120, gold: 50, items: { stone_green: 1 }, badge: 'boss2' }
  });

  // ====================== VÙNG 3: LÂU ĐÀI NGỮ PHÁP ======================
  quest({
    id: 'c_guard', region: 'castle', title: 'Người lính gác tò mò', giver: 'guard', requires: ['f_boss'],
    summary: 'Trả lời các câu hỏi Do/Does của lính gác Max để vào lâu đài.',
    teach: { lesson: ['present', 'dodoes'], words: ['like', 'live', 'castle', 'guard'] },
    intro: [
      { s: 'npc', en: 'Stop! I am a guard. You cannot go in.', vi: 'Dừng lại! Ta là lính gác. Ngươi không được vào.' },
      { s: 'npc', en: 'Answer my questions first!', vi: 'Hãy trả lời câu hỏi của ta trước đã!' },
      { s: 'pip', vi: 'Lính gác sẽ hỏi bằng "Do you...?" và "Does she...?". Mình học cách trả lời ngắn nhé!' }
    ],
    stages: [{
      type: 'talk', npc: 'guard', obj: 'Trả lời câu hỏi của lính gác Max', script: [
        { ask: 'Who are you?', vi: 'Ngươi là ai?', topic: 'greet', build: 'I am {name}.',
          opts: [
            { en: 'I am {name}.', ok: true },
            { en: 'I is {name}.', why: '"I" luôn đi với "am": I am {name}.' }
          ] },
        { ask: 'Do you like cats?', vi: 'Ngươi có thích mèo không?', topic: 'grammar',
          opts: [
            { en: 'Yes, I do.', ok: true },
            { en: 'Yes, I like.', why: 'Câu hỏi "Do you...?" trả lời ngắn là "Yes, I do." hoặc "No, I don\'t."' },
            { en: 'Yes, I does.', why: '"I" đi với "do", không đi với "does".' }
          ] },
        { ask: 'Does your friend Lily like cats?', vi: 'Bạn Lily của ngươi có thích mèo không?', topic: 'grammar',
          opts: [
            { en: 'Yes, she does.', ok: true },
            { en: 'Yes, she do.', why: '"she" đi với "does": Yes, she does.' },
            { en: 'Yes, he does.', why: 'Lily là con gái nên dùng "she".' }
          ] },
        { ask: 'Does a fish like water?', vi: 'Con cá có thích nước không?', topic: 'grammar',
          opts: [
            { en: 'Yes, it does.', ok: true },
            { en: "No, it don't.", why: 'Con cá (it) đi với "does/doesn\'t". Và cá thì thích nước mà!' }
          ] },
        { ask: 'Where do you live?', vi: 'Ngươi sống ở đâu?', topic: 'grammar', build: 'I live in Starter Village.',
          opts: [
            { en: 'I live in Starter Village.', ok: true },
            { en: 'I lives in Starter Village.', why: '"I" + động từ nguyên mẫu: I live (không thêm -s).' }
          ] },
        { s: 'npc', en: 'OK. You are a good person. You can go in!', vi: 'Được rồi. Ngươi là người tốt. Ngươi có thể vào!' }
      ]
    }],
    reward: { xp: 50, gold: 20 }
  });

  quest({
    id: 'c_library', region: 'castle', title: 'Thư viện lộn xộn', giver: 'page', requires: ['c_guard'],
    summary: 'Sắp xếp lại những câu bị xáo trộn trong thư viện.',
    teach: { lesson: 'neg' },
    intro: [
      { s: 'npc', en: 'Shh! This is the library.', vi: 'Suỵt! Đây là thư viện.' },
      { s: 'npc', en: 'The words in my books are all mixed up!', vi: 'Chữ trong sách của cô bị xáo trộn hết rồi!' },
      { s: 'pip', vi: 'Cô Page có vẻ biết điều gì đó về Chúa tể Im Lặng...' }
    ],
    stages: [
      { type: 'quiz', npc: 'page', obj: 'Sắp xếp lại câu trong thư viện', title: 'Thư viện lộn xộn',
        gen: { order: { lessons: ['present', 'dodoes', 'neg'], n: 4 }, grammar: { lessons: ['neg', 'present'], n: 2 } },
        script: [
          { s: 'npc', en: 'Thank you! My books are happy again.', vi: 'Cảm ơn em! Những quyển sách lại vui vẻ rồi.' },
          { s: 'npc', en: 'Look. This is an old letter from Lord Silence.', vi: 'Nhìn này. Đây là một lá thư cũ của Chúa tể Im Lặng.' },
          { s: 'npc', en: '"Nobody listens to me. So I take your words."', vi: '"Không ai lắng nghe ta. Vì thế ta lấy đi lời nói của các ngươi."' },
          { s: 'pip', vi: 'Hóa ra Chúa tể Im Lặng không hẳn là kẻ xấu... ông ấy chỉ cô đơn thôi.' }
        ] }
    ],
    reward: { xp: 50, gold: 20, items: { letter: 1 } }
  });

  quest({
    id: 'c_room', region: 'castle', title: 'Căn phòng của công chúa Mia', giver: 'mia', requires: ['c_guard'],
    summary: 'Giúp công chúa Mia tìm đồ bằng các giới từ vị trí.',
    teach: { lesson: 'prep', words: ['in', 'on', 'under', 'next_to', 'behind', 'in_front_of', 'princess', 'prince', 'crown', 'bed', 'room'] },
    intro: [
      { s: 'npc', en: 'Hello! I am Princess Mia.', vi: 'Xin chào! Ta là công chúa Mia.' },
      { s: 'npc', en: 'Where are my things? Please help me!', vi: 'Đồ của ta đâu hết rồi? Hãy giúp ta với!' }
    ],
    stages: [
      { type: 'quiz', npc: 'mia', obj: 'Giúp công chúa tìm đồ (phòng phía nam)', title: 'Đồ ở đâu?',
        gen: { prep: 5 },
        script: [
          { s: 'npc', en: 'Thank you! You are very kind.', vi: 'Cảm ơn bạn! Bạn thật tốt bụng.' },
          { s: 'npc', en: 'Take this purple dress. It is a royal dress!', vi: 'Tặng bạn chiếc váy tím này. Đây là váy hoàng gia đấy!' }
        ] }
    ],
    reward: { xp: 50, gold: 20, outfit: 'royal' }
  });

  quest({
    id: 'c_gate', region: 'castle', title: 'Cánh cổng CAN', giver: 'knight', requires: ['c_library', 'c_room'],
    summary: 'Mở cánh cổng phép thuật dẫn vào Đại sảnh bằng can / can\'t.',
    teach: { lesson: 'can', words: ['sing', 'dance', 'jump', 'fly', 'climb', 'draw', 'walk', 'speak'] },
    intro: [
      { s: 'npc', en: 'I am the Knight Statue. I guard this door.', vi: 'Ta là Tượng Hiệp sĩ. Ta canh giữ cánh cửa này.' },
      { s: 'npc', en: 'Tell me: who can do what?', vi: 'Hãy nói cho ta biết: ai có thể làm gì?' }
    ],
    stages: [
      { type: 'gate', gate: 'canGate', obj: 'Mở Cổng CAN (phía đông)' },
      { type: 'talk', npc: 'knight', obj: 'Nói chuyện với Tượng Hiệp sĩ', script: [
        { s: 'npc', en: 'You can open the door. You can be a hero!', vi: 'Ngươi đã mở được cửa. Ngươi có thể trở thành anh hùng!' },
        { s: 'pip', vi: 'Người Đá Ngữ Pháp đang giữ Viên Đá Xanh Dương trong Đại sảnh. Hãy chuẩn bị bánh táo và cuộn gợi ý nhé!' }
      ] }
    ],
    reward: { xp: 50, gold: 20 }
  });

  quest({
    id: 'c_boss', region: 'castle', title: 'Người Đá Ngữ Pháp', giver: 'golem', requires: ['c_gate'],
    summary: 'Hóa giải Người Đá Ngữ Pháp và lấy lại Viên Đá Ngữ Pháp.',
    intro: [
      { s: 'npc', en: 'I am the Grammar Golem. I do not like mistakes!', vi: 'Ta là Người Đá Ngữ Pháp. Ta không thích lỗi sai!' },
      { s: 'pip', vi: 'Trận cuối của chương này! Dùng hết kiến thức: am/is/are, have/has, do/does, can, giới từ...' }
    ],
    stages: [
      { type: 'boss', boss: 'golem', obj: 'Hóa giải Người Đá Ngữ Pháp (Đại sảnh)' },
      { type: 'talk', npc: 'mia', obj: 'Báo tin cho công chúa Mia', script: [
        { s: 'npc', en: 'You have the Blue Stone! You are a true hero, {name}!', vi: 'Bạn đã lấy lại Viên Đá Xanh Dương! Bạn là một anh hùng thật sự, {name}!' },
        { s: 'npc', en: 'Lord Silence is at Listening Harbor now.', vi: 'Chúa tể Im Lặng giờ đang ở Hải Cảng Nghe Hiểu.' },
        { s: 'npc', en: 'Maybe he only wants a friend...', vi: 'Có lẽ ông ấy chỉ muốn có một người bạn...' },
        { s: 'pip', vi: 'Bạn đã thu hồi 3/5 viên đá! Hải Cảng Nghe Hiểu và Núi Giao Tiếp sẽ mở trong phiên bản tiếp theo. Trong lúc chờ, hãy ôn từ trong Sổ từ vựng và thử thách của Nhà hiền triết Sao nhé!' }
      ] }
    ],
    reward: { xp: 150, gold: 60, items: { stone_blue: 1 }, badge: 'boss3', outfit: 'star' }
  });

  // ====================== THỬ THÁCH NÂNG CAO (mở khi tiến bộ tốt) ======================
  ['village', 'forest', 'castle'].forEach((r, i) => {
    quest({
      id: 'adv_' + r, region: r, title: 'Thử thách Nhà hiền triết (' + ['Làng', 'Rừng', 'Lâu đài'][i] + ')',
      giver: ['sage_v', 'sage_f', 'sage_c'][i], requires: [['v_boss', 'f_boss', 'c_boss'][i]], advanced: true,
      summary: 'Thử thách nâng cao: ít gợi ý tiếng Việt, nhiều dạng câu khó hơn.',
      intro: [
        { s: 'npc', en: 'You learn fast! Do you want a hard challenge?', vi: 'Cháu học nhanh lắm! Cháu có muốn thử một thử thách khó không?' },
        { s: 'pip', vi: 'Thử thách này dành cho người đã tiến bộ tốt. Không sao nếu sai – cứ thử nhé!' }
      ],
      stages: [
        { type: 'boss', boss: ['sageV', 'sageF', 'sageC'][i], npc: ['sage_v', 'sage_f', 'sage_c'][i], obj: 'Vượt qua thử thách của Nhà hiền triết' },
        { type: 'talk', npc: ['sage_v', 'sage_f', 'sage_c'][i], obj: 'Nói chuyện với Nhà hiền triết', script: [
          { s: 'npc', en: 'Excellent! You are a star!', vi: 'Xuất sắc! Cháu là một ngôi sao!' }
        ] }
      ],
      reward: { xp: 80, gold: 40, badge: 'sage_' + r }
    });
  });

  EQ.QUESTS = Q;
  EQ.QI = {};
  Q.forEach(q => { EQ.QI[q.id] = q; });

  // ====================== TRÙM & QUÁI VẬT ======================
  // pool: nguồn câu hỏi. regions: từ vựng của vùng nào. lessons: ngữ pháp nào. types: dạng câu.
  EQ.BOSSES = {
    slimeKing: { mastery: { region: 'village', need: 0.5 }, name: 'Vua Slime Ục Ịch', draw: 'slime', color: '#e53935', crown: true, hp: 8, size: 2.2,
      regions: ['village'], lessons: ['greet', 'this', 'tobe'], types: ['meaning', 'pic', 'listen', 'grammar', 'order', 'en', 'riddle', 'type'],
      win: { en: 'Blub... Thank you. I was under a bad spell.', vi: 'Bụp... Cảm ơn cậu. Ta đã bị trúng một lời nguyền xấu.' } },
    mushKing: { mastery: { region: 'forest', need: 0.5 }, name: 'Vua Nấm Cáu Kỉnh', draw: 'mush', color: '#8e24aa', crown: true, hp: 10, size: 2.2,
      regions: ['forest', 'village'], lessons: ['hesh', 'plural', 'have', 'order', 'tobe'], types: ['meaning', 'pic', 'listen', 'grammar', 'order', 'en', 'riddle', 'type'],
      win: { en: 'Oh... my head! Thank you, little hero.', vi: 'Ôi... đầu ta! Cảm ơn cháu, người anh hùng nhỏ.' } },
    golem: { mastery: { region: 'castle', need: 0.5 }, name: 'Người Đá Ngữ Pháp', draw: 'golem', color: '#78909c', crown: false, hp: 12, size: 2.4,
      regions: ['castle', 'forest', 'village'], lessons: ['present', 'dodoes', 'neg', 'can', 'prep', 'have', 'tobe'], types: ['grammar', 'order', 'prep', 'listen', 'meaning', 'en', 'riddle', 'type'],
      win: { en: 'You are right. Mistakes help us learn.', vi: 'Ngươi nói đúng. Lỗi sai giúp chúng ta học hỏi.' } },
    sageV: { name: 'Ảo ảnh Ngôi Sao', draw: 'star', color: '#ffd54f', hp: 8, size: 1.8, hard: true,
      regions: ['village'], lessons: ['greet', 'this', 'tobe'], types: ['en', 'listen', 'spell', 'order', 'grammar', 'type', 'riddle'],
      win: { en: 'Well done!', vi: 'Làm tốt lắm!' } },
    sageF: { name: 'Ảo ảnh Ngôi Sao', draw: 'star', color: '#aed581', hp: 10, size: 1.8, hard: true,
      regions: ['forest', 'village'], lessons: ['plural', 'have', 'hesh', 'order'], types: ['en', 'listen', 'spell', 'order', 'grammar', 'type', 'riddle'],
      win: { en: 'Well done!', vi: 'Làm tốt lắm!' } },
    sageC: { name: 'Ảo ảnh Ngôi Sao', draw: 'star', color: '#81d4fa', hp: 12, size: 1.8, hard: true,
      regions: ['castle', 'forest', 'village'], lessons: ['present', 'dodoes', 'neg', 'can', 'prep'], types: ['en', 'listen', 'spell', 'order', 'grammar', 'prep', 'type', 'riddle'],
      win: { en: 'Well done!', vi: 'Làm tốt lắm!' } }
  };
  EQ.MONSTERS = {
    slime: { name: 'Slime nghịch ngợm', draw: 'slime', colors: ['#66bb6a', '#42a5f5', '#ffca28'], hp: 3, xp: 12, gold: 4, bite: 8 },
    fluff: { name: 'Bông xù tinh nghịch', draw: 'fluff', colors: ['#f48fb1', '#ce93d8', '#80deea'], hp: 4, xp: 14, gold: 5, bite: 10 },
    ink: { name: 'Giọt mực lém lỉnh', draw: 'slime', colors: ['#5c6bc0', '#26a69a', '#7e57c2'], hp: 5, xp: 16, gold: 6, bite: 12 },
    // Vùng Hoang Dã (bản 1.8): máu nhiều, cắn đau, thưởng lớn
    wolf: { name: 'Sói Bông Hoang', draw: 'fluff', colors: ['#8d6e63', '#78909c', '#a1887f'], hp: 8, xp: 30, gold: 14, bite: 16, matk: 2 },
    shroom: { name: 'Nấm Độc Rừng Sâu', draw: 'mush', colors: ['#8e24aa', '#e53935', '#ff7043'], hp: 10, xp: 36, gold: 16, bite: 18, matk: 2 },
    imp: { name: 'Tinh Linh Lửa', draw: 'star', colors: ['#ff7043', '#ffca28', '#f4511e'], hp: 12, xp: 42, gold: 20, bite: 20, matk: 2 },
    rock: { name: 'Người Đá Con', draw: 'golem', colors: ['#78909c', '#8d6e63', '#546e7a'], hp: 15, xp: 50, gold: 25, bite: 22, matk: 3 }
  };

  // ====================== VẬT PHẨM ======================
  EQ.ITEMS = {
    map: { name: 'Bản đồ làng', e: '🗺️', desc: 'Bấm M để xem bản đồ những nơi đã khám phá.' },
    wand: { name: 'Đũa phép Ngôn ngữ', e: '🪄', desc: 'Dùng tiếng Anh để hóa giải quái vật.' },
    spellbook: { name: 'Sách phép thuật', e: '📘', desc: 'Phép thuật mạnh hơn: +1 sát thương mỗi câu đúng.' },
    pie: { name: 'Bánh táo', e: '🥧', desc: 'Dùng trong trận đấu: hồi 35 máu ❤️.', use: 'battle' },
    hint: { name: 'Cuộn gợi ý', e: '📜', desc: 'Dùng khi trả lời: loại bỏ 2 đáp án sai.', use: 'question' },
    letter: { name: 'Lá thư cũ', e: '✉️', desc: '"Nobody listens to me. So I take your words." – Chúa tể Im Lặng' },
    stone_red: { name: 'Viên Đá Lời Chào', e: '🔴', desc: 'Viên đá phép thuật thứ 1/5.', stone: true },
    stone_green: { name: 'Viên Đá Từ Vựng', e: '🟢', desc: 'Viên đá phép thuật thứ 2/5.', stone: true },
    stone_blue: { name: 'Viên Đá Ngữ Pháp', e: '🔵', desc: 'Viên đá phép thuật thứ 3/5.', stone: true }
  };
  EQ.SHOP_ITEMS = [
    { id: 'pie', price: 12 },
    { id: 'hint', price: 15 }
  ];
  // Hàng hóa cho nhiệm vụ đi chợ (giá bằng xu của nhiệm vụ)
  EQ.MARKET = [
    { id: 'egg', en: 'egg', pl: 'eggs', e: '🥚', price: 1 },
    { id: 'apple', en: 'apple', pl: 'apples', e: '🍎', price: 1 },
    { id: 'water', en: 'bottle of water', pl: 'bottles of water', e: '💧', price: 2 },
    { id: 'milk', en: 'bottle of milk', pl: 'bottles of milk', e: '🥛', price: 3 },
    { id: 'bread', en: 'loaf of bread', pl: 'loaves of bread', e: '🍞', price: 2 },
    { id: 'cake', en: 'cake', pl: 'cakes', e: '🎂', price: 4 }
  ];

  // ====================== TRANG PHỤC ======================
  EQ.OUTFITS = {
    basic: { name: 'Áo phiêu lưu', top: '#4fc3f7', bottom: '#1565c0', desc: 'Trang phục khởi đầu' },
    pink: { name: 'Nơ hồng của Lily', top: '#f06292', bottom: '#ad1457', bow: '#ff80ab', desc: 'Quà của Lily' },
    sailor: { name: 'Áo thủy thủ', top: '#ffffff', bottom: '#1a237e', collar: '#1e88e5', desc: 'Quà của bác Sam' },
    hero: { name: 'Áo anh hùng', top: '#e53935', bottom: '#424242', cape: '#c62828', desc: 'Hóa giải Vua Slime' },
    ranger: { name: 'Áo choàng kiểm lâm', top: '#2e7d32', bottom: '#5d4037', cape: '#43a047', desc: 'Quà của Anna' },
    doctor: { name: 'Áo bác sĩ', top: '#eceff1', bottom: '#90a4ae', desc: 'Quà của Bác sĩ Hươu' },
    royal: { name: 'Váy hoàng gia', top: '#8e24aa', bottom: '#6a1b9a', cape: '#ffd54f', desc: 'Quà của công chúa Mia' },
    star: { name: 'Áo choàng ngôi sao', top: '#1a237e', bottom: '#283593', cape: '#ffd54f', stars: true, desc: 'Hoàn thành chương 1' }
  };
  EQ.HAIRS = { long: 'Tóc dài', pony: 'Tóc đuôi ngựa', bun: 'Tóc búi', short: 'Tóc ngắn', twin: 'Tóc hai bím' };
  EQ.HAIR_COLORS = ['#3e2723', '#212121', '#6d4c41', '#c62828', '#ffb300', '#f8bbd0', '#7e57c2', '#26c6da'];
  EQ.SKINS = ['#ffe0bd', '#f5d0a9', '#e8b98a', '#c68642', '#8d5524'];

  // ====================== HUY HIỆU ======================
  EQ.BADGES = {
    first_quest: { name: 'Bước chân đầu tiên', e: '👣', desc: 'Hoàn thành nhiệm vụ đầu tiên' },
    words10: { name: 'Nhà sưu tầm từ', e: '📗', desc: 'Học 10 từ vựng' },
    words50: { name: 'Thư viện nhỏ', e: '📚', desc: 'Học 50 từ vựng' },
    words100: { name: 'Bậc thầy từ vựng', e: '🏆', desc: 'Học 100 từ vựng' },
    master20: { name: 'Trí nhớ siêu phàm', e: '🧠', desc: '20 từ ở mức "Nhớ tốt"' },
    streak10: { name: 'Chuỗi 10 câu đúng', e: '🔥', desc: 'Trả lời đúng 10 câu liên tiếp' },
    shopper: { name: 'Người đi chợ giỏi', e: '🛒', desc: 'Hoàn thành nhiệm vụ đi chợ' },
    explorer: { name: 'Nhà thám hiểm', e: '🧭', desc: 'Tìm ra một khu vực bí mật' },
    boss1: { name: 'Hiệp sĩ Lời Chào', e: '🔴', desc: 'Hóa giải Vua Slime' },
    boss2: { name: 'Hiệp sĩ Từ Vựng', e: '🟢', desc: 'Hóa giải Vua Nấm' },
    boss3: { name: 'Hiệp sĩ Ngữ Pháp', e: '🔵', desc: 'Hóa giải Người Đá Ngữ Pháp' },
    days3: { name: 'Chăm chỉ 3 ngày', e: '📅', desc: 'Chơi và học 3 ngày khác nhau' },
    review: { name: 'Ôn bài chăm chỉ', e: '🔁', desc: 'Hoàn thành 5 lượt ôn tập trong Sổ từ vựng' },
    daily5: { name: 'Kiên trì 5 ngày', e: '🗓️', desc: 'Hoàn thành 5 Thử thách hôm nay' },
    master_village: { name: 'Thuộc lòng Làng', e: '🏡', desc: 'Thuộc ít nhất 50% từ của Làng Khởi Đầu' },
    sage_village: { name: 'Ngôi sao của Làng', e: '⭐', desc: 'Vượt thử thách nâng cao ở Làng' },
    sage_forest: { name: 'Ngôi sao của Rừng', e: '🌟', desc: 'Vượt thử thách nâng cao ở Rừng' },
    sage_castle: { name: 'Ngôi sao Lâu đài', e: '💫', desc: 'Vượt thử thách nâng cao ở Lâu đài' }
  };
})();
