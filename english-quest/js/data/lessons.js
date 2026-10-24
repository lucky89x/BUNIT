/* ENGLISH QUEST - Bài học ngữ pháp, ngân hàng câu hỏi điền từ, câu sắp xếp
 * LESSONS: bài giảng ngắn bằng tiếng Việt, có ví dụ đọc được.
 * GRAMMAR: câu điền chỗ trống. a = đáp án đúng, ex = giải thích tiếng Việt khi sai, vi = nghĩa câu.
 * SENTENCES: câu dùng cho dạng "sắp xếp từ thành câu".
 * lv: 1 = rất dễ, 2 = dễ, 3 = khá (dùng cho điều chỉnh độ khó).
 */
window.EQ = window.EQ || {};
(function () {
  EQ.LESSONS = {
    greet: {
      title: 'Chào hỏi và giới thiệu bản thân', icon: '👋',
      points: [
        ['Hello! / Hi!', 'Xin chào! (Hi thân mật hơn)'],
        ['My name is Anna.', 'Tên mình là Anna. → "My name is + tên"'],
        ["I am Anna. / I'm Anna.", 'Mình là Anna. (I\'m = I am)'],
        ['I am twelve.', 'Mình 12 tuổi. → "I am + số tuổi". KHÔNG nói "I have twelve years".'],
        ['Nice to meet you!', 'Rất vui được gặp bạn!'],
        ['Goodbye!', 'Tạm biệt!']
      ]
    },
    this: {
      title: 'This is... / It is... và mạo từ a, an', icon: '👉',
      points: [
        ['This is a cat.', 'Đây là một con mèo. (This is = Đây là)'],
        ['It is black.', 'Nó màu đen. (It = nó, chỉ con vật hoặc đồ vật)'],
        ['a cat, a dog, a book', 'Dùng "a" trước từ bắt đầu bằng phụ âm.'],
        ['an apple, an egg, an orange', 'Dùng "an" trước từ bắt đầu bằng nguyên âm a, e, i, o, u.'],
        ['a red apple', 'Màu sắc đứng TRƯỚC đồ vật: a red apple (một quả táo đỏ).']
      ]
    },
    tobe: {
      title: 'Động từ TO BE: am / is / are', icon: '🔑',
      points: [
        ['I am a student.', 'I luôn đi với AM. (I am = I\'m)'],
        ['He is my friend. She is a teacher. It is a cat.', 'He, She, It (một người, một vật) đi với IS.'],
        ['You are my friend.', 'You đi với ARE.'],
        ['We are friends. They are students.', 'We, They (nhiều người) đi với ARE.'],
        ['My name is Lily. The apples are red.', 'Một thứ → is. Nhiều thứ → are.']
      ]
    },
    plural: {
      title: 'Danh từ số nhiều', icon: '🍎🍎',
      points: [
        ['one cat → two cats', 'Thông thường: thêm -s.'],
        ['one box → two boxes', 'Tận cùng là s, x, ch, sh: thêm -es.'],
        ['one baby → two babies', 'Phụ âm + y: bỏ y, thêm -ies.'],
        ['one foot → two feet, one tooth → two teeth', 'Một số từ đặc biệt phải học thuộc.'],
        ['one fish → two fish', 'fish (con cá) số nhiều vẫn là fish.']
      ]
    },
    hesh: {
      title: 'He / She – Who is he? Who is she?', icon: '👫',
      points: [
        ['He', 'anh ấy, ông ấy, bạn ấy (con trai/đàn ông)'],
        ['She', 'cô ấy, bà ấy, bạn ấy (con gái/phụ nữ)'],
        ['Who is he? – He is my father.', 'Ông ấy là ai? – Ông ấy là bố của mình.'],
        ['Who is she? – She is your mother.', 'Cô ấy là ai? – Cô ấy là mẹ của bạn.'],
        ['my / your', 'my = của tôi, your = của bạn']
      ]
    },
    have: {
      title: 'HAVE / HAS – có', icon: '🎁',
      points: [
        ['I have a dog.', 'I, You, We, They + HAVE'],
        ['She has a cat.', 'He, She, It + HAS'],
        ['The rabbit has long ears.', 'Một con vật (it) → has'],
        ['We have two hands.', 'Chúng ta có hai bàn tay.']
      ]
    },
    order: {
      title: 'Trật tự từ trong câu', icon: '🧩',
      points: [
        ['I + have + a pen.', 'Câu cơ bản: AI + LÀM GÌ / LÀ GÌ + PHẦN CÒN LẠI.'],
        ['She + is + my teacher.', 'Cô ấy là cô giáo của mình.'],
        ['a red apple', 'Màu sắc đứng trước: a red apple (KHÔNG nói "an apple red").'],
        ['My name is Lily.', 'Câu tiếng Anh viết hoa chữ cái đầu và có dấu chấm ở cuối.']
      ]
    },
    present: {
      title: 'Thì hiện tại đơn – nói về thói quen, sở thích', icon: '🔁',
      points: [
        ['I like apples. They swim every day.', 'I, You, We, They + động từ nguyên mẫu.'],
        ['She likes apples. He plays every day.', 'He, She, It + động từ thêm -s.'],
        ['He watches TV.', 'Động từ tận cùng là ch, sh, s, x, o: thêm -es (watch → watches, go → goes).'],
        ['every day', 'mỗi ngày – dấu hiệu của thì hiện tại đơn.']
      ]
    },
    dodoes: {
      title: 'Câu hỏi với DO / DOES', icon: '❓',
      points: [
        ['Do you like cats?', 'Do + I/you/we/they + động từ nguyên mẫu?'],
        ['Does she like cats?', 'Does + he/she/it + động từ nguyên mẫu? (KHÔNG thêm -s sau does)'],
        ['Yes, I do. / No, I don\'t.', 'Trả lời ngắn với I, you, we, they.'],
        ['Yes, she does. / No, she doesn\'t.', 'Trả lời ngắn với he, she, it.']
      ]
    },
    neg: {
      title: 'Câu phủ định: DON\'T / DOESN\'T', icon: '🚫',
      points: [
        ['I don\'t like milk.', 'I, You, We, They + don\'t + động từ nguyên mẫu.'],
        ['She doesn\'t like milk.', 'He, She, It + doesn\'t + động từ nguyên mẫu.'],
        ['don\'t = do not, doesn\'t = does not', 'Sau doesn\'t, động từ KHÔNG thêm -s.']
      ]
    },
    prep: {
      title: 'Giới từ chỉ vị trí', icon: '📍',
      points: [
        ['in', 'ở trong: The cat is in the box.'],
        ['on', 'ở trên (chạm mặt): The book is on the table.'],
        ['under', 'ở dưới: The ball is under the table.'],
        ['next to', 'bên cạnh: The dog is next to the table.'],
        ['behind / in front of', 'phía sau / phía trước: The cat is behind the box.'],
        ['Where is the cat? – It is under the table.', 'Con mèo ở đâu? – Nó ở dưới cái bàn.']
      ]
    },
    can: {
      title: 'CAN / CAN\'T – có thể / không thể', icon: '💪',
      points: [
        ['Birds can fly.', 'Chủ ngữ + can + động từ nguyên mẫu.'],
        ['Fish can\'t walk.', 'can\'t = cannot (không thể).'],
        ['Can you swim? – Yes, I can. / No, I can\'t.', 'Hỏi và trả lời ngắn.'],
        ['She can sing.', 'Sau can KHÔNG thêm -s: KHÔNG nói "can sings".']
      ]
    }
  };

  // Câu điền từ: [lesson, câu, các lựa chọn (đáp án đúng đứng đầu), giải thích, nghĩa, độ khó]
  const G = [];
  function q(l, text, opts, ex, vi, lv) { G.push({ l, q: text, a: opts[0], opts, ex, vi, lv: lv || 1 }); }

  q('greet', 'My ___ is Lily.', ['name', 'am', 'is'], 'Mẫu câu giới thiệu tên: "My name is + tên".', 'Tên mình là Lily.');
  q('greet', 'I ___ twelve.', ['am', 'have', 'is'], 'Nói tuổi: "I am + số tuổi". Không dùng "have".', 'Mình 12 tuổi.');
  q('greet', '___ to meet you!', ['Nice', 'Name', 'Hello'], '"Nice to meet you" = Rất vui được gặp bạn.', 'Rất vui được gặp bạn!');
  q('greet', 'Good ___, teacher!', ['morning', 'name', 'meet'], '"Good morning" = Chào buổi sáng.', 'Chào buổi sáng ạ!');

  q('this', 'This is ___ apple.', ['an', 'a'], '"apple" bắt đầu bằng nguyên âm "a" nên dùng "an".', 'Đây là một quả táo.');
  q('this', 'This is ___ book.', ['a', 'an'], '"book" bắt đầu bằng phụ âm "b" nên dùng "a".', 'Đây là một quyển sách.');
  q('this', 'It is ___ egg.', ['an', 'a'], '"egg" bắt đầu bằng nguyên âm "e" nên dùng "an".', 'Nó là một quả trứng.');
  q('this', 'It is ___ cat.', ['a', 'an'], '"cat" bắt đầu bằng phụ âm "c" nên dùng "a".', 'Nó là một con mèo.');
  q('this', 'I have ___ orange bag.', ['an', 'a'], '"orange" bắt đầu bằng nguyên âm "o" nên dùng "an".', 'Mình có một cái cặp màu cam.', 2);
  q('this', '___ is a dog.', ['This', 'Is', 'A'], '"This is..." = Đây là...', 'Đây là một con chó.');
  q('this', 'It is a ___ apple.', ['red', 'an', 'is'], 'Màu sắc đứng trước đồ vật: a red apple.', 'Nó là một quả táo đỏ.', 2);

  q('tobe', 'She ___ a student.', ['is', 'am', 'are'], 'She (cô ấy) đi với "is".', 'Cô ấy là học sinh.');
  q('tobe', 'I ___ twelve.', ['am', 'is', 'are'], 'I luôn đi với "am".', 'Mình 12 tuổi.');
  q('tobe', 'You ___ my friend.', ['are', 'is', 'am'], 'You đi với "are".', 'Bạn là bạn của mình.');
  q('tobe', 'He ___ a teacher.', ['is', 'are', 'am'], 'He (anh ấy, ông ấy) đi với "is".', 'Ông ấy là giáo viên.');
  q('tobe', 'It ___ a cat.', ['is', 'am', 'are'], 'It (nó) đi với "is".', 'Nó là một con mèo.');
  q('tobe', 'We ___ friends.', ['are', 'is', 'am'], 'We (chúng mình) là nhiều người nên đi với "are".', 'Chúng mình là bạn bè.');
  q('tobe', 'They ___ students.', ['are', 'is', 'am'], 'They (họ) là nhiều người nên đi với "are".', 'Họ là học sinh.', 2);
  q('tobe', 'My name ___ Lily.', ['is', 'are', 'am'], '"My name" là một thứ nên đi với "is".', 'Tên mình là Lily.');
  q('tobe', 'The apples ___ red.', ['are', 'is', 'am'], '"The apples" có -s, là nhiều quả nên đi với "are".', 'Những quả táo màu đỏ.', 2);
  q('tobe', 'The cat ___ black.', ['is', 'are', 'am'], '"The cat" là một con nên đi với "is".', 'Con mèo màu đen.');

  q('plural', 'one cat, two ___', ['cats', 'cat', 'cates'], 'Thông thường thêm -s: cat → cats.', 'một con mèo, hai con mèo');
  q('plural', 'one box, three ___', ['boxes', 'boxs', 'box'], 'Tận cùng là x thì thêm -es: box → boxes.', 'một cái hộp, ba cái hộp', 2);
  q('plural', 'one foot, two ___', ['feet', 'foots', 'feets'], 'foot là từ đặc biệt: one foot → two feet.', 'một bàn chân, hai bàn chân', 3);
  q('plural', 'one baby, two ___', ['babies', 'babys', 'baby'], 'Phụ âm + y: bỏ y thêm -ies: baby → babies.', 'một em bé, hai em bé', 2);
  q('plural', 'I have two ___.', ['hands', 'hand', 'handes'], 'Có "two" nên dùng số nhiều: hands.', 'Mình có hai bàn tay.');
  q('plural', 'one bird, four ___', ['birds', 'bird', 'birdes'], 'Thông thường thêm -s: bird → birds.', 'một con chim, bốn con chim');
  q('plural', 'one banana, two ___', ['bananas', 'banana', 'bananaes'], 'Thêm -s: banana → bananas.', 'một quả chuối, hai quả chuối');
  q('plural', 'one tooth, two ___', ['teeth', 'tooths', 'toothes'], 'tooth là từ đặc biệt: one tooth → two teeth.', 'một cái răng, hai cái răng', 3);
  q('plural', 'one fish, three ___', ['fish', 'fishs', 'fishies'], 'fish số nhiều vẫn là fish.', 'một con cá, ba con cá', 3);

  q('hesh', 'Who is ___? – He is my father.', ['he', 'she', 'it'], 'Câu trả lời dùng "He" (bố là đàn ông) nên hỏi "Who is he?".', 'Ông ấy là ai? – Ông ấy là bố mình.');
  q('hesh', '___ is my mother.', ['She', 'He', 'It'], 'Mẹ là phụ nữ → dùng "She".', 'Bà ấy là mẹ của mình.');
  q('hesh', '___ is my brother.', ['He', 'She', 'It'], 'Anh trai/em trai là con trai → dùng "He".', 'Bạn ấy là anh trai mình.');
  q('hesh', '___ is my grandmother.', ['She', 'He', 'It'], 'Bà là phụ nữ → dùng "She".', 'Bà ấy là bà của mình.');
  q('hesh', 'She is ___ sister.', ['my', 'I', 'me'], '"my sister" = chị/em gái của mình. Dùng "my" trước người thân.', 'Bạn ấy là chị gái của mình.', 2);

  q('have', 'I ___ a dog.', ['have', 'has'], 'I đi với "have".', 'Mình có một con chó.');
  q('have', 'She ___ two brothers.', ['has', 'have'], 'She đi với "has".', 'Cô ấy có hai anh trai.');
  q('have', 'He ___ a red bag.', ['has', 'have'], 'He đi với "has".', 'Bạn ấy có một cái cặp đỏ.');
  q('have', 'We ___ a big family.', ['have', 'has'], 'We đi với "have".', 'Chúng mình có một gia đình lớn.');
  q('have', 'The rabbit ___ long ears.', ['has', 'have'], '"The rabbit" là một con (it) nên đi với "has".', 'Con thỏ có đôi tai dài.', 2);
  q('have', 'They ___ three cats.', ['have', 'has'], 'They đi với "have".', 'Họ có ba con mèo.');
  q('have', 'My mother ___ black hair.', ['has', 'have'], '"My mother" = she nên đi với "has".', 'Mẹ mình có mái tóc đen.', 2);
  q('have', 'You ___ a nice hat.', ['have', 'has'], 'You đi với "have".', 'Bạn có một cái mũ đẹp.');

  q('present', 'She ___ apples.', ['likes', 'like', 'liking'], 'She + động từ thêm -s: likes.', 'Cô ấy thích táo.');
  q('present', 'I ___ milk every morning.', ['drink', 'drinks', 'drinking'], 'I + động từ nguyên mẫu: drink.', 'Mình uống sữa mỗi sáng.');
  q('present', 'He ___ with his dog.', ['plays', 'play', 'playing'], 'He + động từ thêm -s: plays.', 'Bạn ấy chơi với con chó của bạn ấy.');
  q('present', 'My father ___ every day.', ['cooks', 'cook', 'cooking'], '"My father" = he, nên thêm -s: cooks.', 'Bố mình nấu ăn mỗi ngày.', 2);
  q('present', 'They ___ in the river.', ['swim', 'swims', 'swimming'], 'They + động từ nguyên mẫu: swim.', 'Họ bơi ở dưới sông.', 2);
  q('present', 'Lily ___ up at six.', ['wakes', 'wake', 'waking'], '"Lily" = she, nên thêm -s: wakes.', 'Lily thức dậy lúc sáu giờ.', 2);
  q('present', 'Minh ___ books every day.', ['reads', 'read', 'reading'], '"Minh" = he, nên thêm -s: reads.', 'Minh đọc sách mỗi ngày.');
  q('present', 'He ___ TV in the evening.', ['watches', 'watchs', 'watch'], 'watch tận cùng là ch nên thêm -es: watches.', 'Bạn ấy xem ti vi vào buổi tối.', 3);
  q('present', 'We ___ in a small house.', ['live', 'lives', 'living'], 'We + động từ nguyên mẫu: live.', 'Chúng mình sống trong một ngôi nhà nhỏ.', 2);

  q('dodoes', '___ you like cats?', ['Do', 'Does', 'Are'], 'Với "you" dùng "Do".', 'Bạn có thích mèo không?');
  q('dodoes', '___ she like milk?', ['Does', 'Do', 'Is'], 'Với "she" dùng "Does".', 'Cô ấy có thích sữa không?');
  q('dodoes', '___ he play with his dog?', ['Does', 'Do', 'Is'], 'Với "he" dùng "Does".', 'Bạn ấy có chơi với con chó không?');
  q('dodoes', '___ they live in the forest?', ['Do', 'Does', 'Are'], 'Với "they" dùng "Do".', 'Họ có sống trong rừng không?', 2);
  q('dodoes', 'Does she like fish? – Yes, she ___.', ['does', 'do', 'is'], 'Câu hỏi với "Does" thì trả lời "Yes, she does."', 'Cô ấy có thích cá không? – Có.');
  q('dodoes', 'Do you like bananas? – No, I ___.', ["don't", "doesn't", 'not'], 'Với "I" trả lời "No, I don\'t."', 'Bạn có thích chuối không? – Không.');
  q('dodoes', 'Does he swim? – No, he ___.', ["doesn't", "don't", 'not'], 'Với "he" trả lời "No, he doesn\'t."', 'Bạn ấy có bơi không? – Không.', 2);
  q('dodoes', 'Does Lily ___ apples?', ['like', 'likes', 'liking'], 'Sau "Does", động từ trở về nguyên mẫu: like (không thêm -s).', 'Lily có thích táo không?', 3);

  q('neg', 'I ___ like milk.', ["don't", "doesn't", 'not'], 'I + don\'t.', 'Mình không thích sữa.');
  q('neg', 'She ___ like tea.', ["doesn't", "don't", 'not'], 'She + doesn\'t.', 'Cô ấy không thích trà.');
  q('neg', "He doesn't ___ fish.", ['eat', 'eats', 'eating'], 'Sau "doesn\'t", động từ nguyên mẫu: eat.', 'Bạn ấy không ăn cá.', 2);
  q('neg', 'They ___ have a dog.', ["don't", "doesn't", 'not'], 'They + don\'t.', 'Họ không có con chó nào.');
  q('neg', 'The cat ___ like water.', ["doesn't", "don't", 'not'], '"The cat" = it, đi với doesn\'t.', 'Con mèo không thích nước.', 2);
  q('neg', "We don't ___ TV in the morning.", ['watch', 'watches', 'watching'], 'Sau "don\'t", động từ nguyên mẫu: watch.', 'Chúng mình không xem ti vi vào buổi sáng.', 3);

  q('can', 'Birds ___ fly.', ['can', "can't"], 'Chim biết bay → can.', 'Chim có thể bay.');
  q('can', 'Fish ___ walk.', ["can't", 'can'], 'Cá không đi bộ được → can\'t.', 'Cá không thể đi bộ.');
  q('can', 'A fish can ___.', ['swim', 'swims', 'swimming'], 'Sau "can" dùng động từ nguyên mẫu: swim.', 'Con cá có thể bơi.', 2);
  q('can', 'Monkeys ___ climb trees.', ['can', "can't"], 'Khỉ trèo cây giỏi → can.', 'Khỉ có thể trèo cây.');
  q('can', 'Elephants ___ fly.', ["can't", 'can'], 'Voi không bay được → can\'t.', 'Voi không thể bay.');
  q('can', '___ you dance? – Yes, I can.', ['Can', 'Are', 'Is'], 'Trả lời "Yes, I can" thì câu hỏi bắt đầu bằng "Can".', 'Bạn có thể nhảy múa không? – Có.', 2);
  q('can', 'She can ___ very well.', ['sing', 'sings', 'singing'], 'Sau "can" dùng động từ nguyên mẫu: sing.', 'Cô ấy có thể hát rất hay.', 2);
  q('can', 'Can a rabbit jump? – Yes, it ___.', ['can', "can't", 'is'], 'Thỏ bật nhảy giỏi → "Yes, it can."', 'Con thỏ có thể bật nhảy không? – Có.');
  q('can', 'Can a cow fly? – No, it ___.', ["can't", 'can', "doesn't"], 'Bò không bay được → "No, it can\'t."', 'Con bò có thể bay không? – Không.', 2);

  EQ.GRAMMAR = G;

  // Câu sắp xếp: [lesson, câu, nghĩa, độ khó]
  const S = [];
  function s(l, sentence, vi, lv) { S.push({ l, s: sentence, vi, lv: lv || 1 }); }
  s('greet', 'My name is Lily.', 'Tên mình là Lily.');
  s('greet', 'I am twelve.', 'Mình 12 tuổi.');
  s('greet', 'Nice to meet you!', 'Rất vui được gặp bạn!');
  s('this', 'This is a cat.', 'Đây là một con mèo.');
  s('this', 'It is a red apple.', 'Nó là một quả táo đỏ.', 2);
  s('tobe', 'She is a student.', 'Cô ấy là học sinh.');
  s('tobe', 'We are friends.', 'Chúng mình là bạn bè.');
  s('tobe', 'My mother is a teacher.', 'Mẹ mình là giáo viên.', 2);
  s('hesh', 'He is my brother.', 'Bạn ấy là anh trai của mình.');
  s('hesh', 'She is my grandmother.', 'Bà ấy là bà của mình.');
  s('have', 'I have a pen.', 'Mình có một cái bút.');
  s('have', 'He has a black dog.', 'Bạn ấy có một con chó đen.', 2);
  s('have', 'The rabbit has long ears.', 'Con thỏ có đôi tai dài.', 2);
  s('order', 'I have a blue pencil.', 'Mình có một cây bút chì màu xanh dương.', 2);
  s('order', 'She is my teacher.', 'Cô ấy là cô giáo của mình.');
  s('order', 'I go to school.', 'Mình đi học.');
  s('present', 'I like bananas.', 'Mình thích chuối.');
  s('present', 'She likes apples.', 'Cô ấy thích táo.');
  s('present', 'He reads books every day.', 'Bạn ấy đọc sách mỗi ngày.', 2);
  s('dodoes', 'Do you like milk?', 'Bạn có thích sữa không?');
  s('dodoes', 'Does she like cats?', 'Cô ấy có thích mèo không?', 2);
  s('neg', "I don't like fish.", 'Mình không thích cá.');
  s('neg', "She doesn't drink milk.", 'Cô ấy không uống sữa.', 2);
  s('prep', 'The cat is under the table.', 'Con mèo ở dưới cái bàn.', 2);
  s('prep', 'The book is on the table.', 'Quyển sách ở trên bàn.', 2);
  s('can', 'Birds can fly.', 'Chim có thể bay.');
  s('can', 'I can swim.', 'Mình có thể bơi.');
  s('can', "Fish can't walk.", 'Cá không thể đi bộ.', 2);
  EQ.SENTENCES = S;

  // Cảnh minh họa giới từ (vẽ bằng SVG trong challenge.js)
  // group: các câu trả lời trong cùng một nhóm vật mốc để tránh mơ hồ
  EQ.PREP_SCENES = [
    { id: 'on', obj: 'cat', ref: 'table', ans: 'on the table', vi: 'ở trên cái bàn' },
    { id: 'under', obj: 'cat', ref: 'table', ans: 'under the table', vi: 'ở dưới cái bàn' },
    { id: 'next_to', obj: 'cat', ref: 'table', ans: 'next to the table', vi: 'ở bên cạnh cái bàn' },
    { id: 'in', obj: 'cat', ref: 'box', ans: 'in the box', vi: 'ở trong cái hộp' },
    { id: 'behind', obj: 'cat', ref: 'box', ans: 'behind the box', vi: 'ở phía sau cái hộp' },
    { id: 'in_front_of', obj: 'cat', ref: 'box', ans: 'in front of the box', vi: 'ở phía trước cái hộp' },
    { id: 'on', obj: 'ball', ref: 'table', ans: 'on the table', vi: 'ở trên cái bàn' },
    { id: 'under', obj: 'ball', ref: 'table', ans: 'under the table', vi: 'ở dưới cái bàn' },
    { id: 'next_to', obj: 'dog', ref: 'table', ans: 'next to the table', vi: 'ở bên cạnh cái bàn' },
    { id: 'in', obj: 'ball', ref: 'box', ans: 'in the box', vi: 'ở trong cái hộp' },
    { id: 'in_front_of', obj: 'dog', ref: 'box', ans: 'in front of the box', vi: 'ở phía trước cái hộp' },
    { id: 'behind', obj: 'dog', ref: 'box', ans: 'behind the box', vi: 'ở phía sau cái hộp' }
  ];
})();
