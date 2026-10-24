/* ENGLISH QUEST - Học theo chương trình Tiếng Anh Global Success (lớp 6 và lớp 8)
 *
 * LƯU Ý: đây là bộ TỪ THEO CHỦ ĐỀ của từng Unit do game soạn để ôn luyện, KHÔNG phải danh sách
 * từ vựng chính thức in trong sách. Phụ huynh có thể nhập thêm đúng các từ trong sách của con
 * ở Bảng phụ huynh → "Nhập từ theo sách".
 *
 * Mỗi Unit: n (số), en (tên Unit), vi (nghĩa), focus (trọng tâm ngữ pháp để phụ huynh tham khảo),
 * lessons (bài ngữ pháp trong game liên quan), words: [id, en, vi, emoji, ví dụ, nghĩa ví dụ, pic?]
 */
window.EQ = window.EQ || {};
(function () {
  const C = {};
  function unit(book, n, en, vi, focus, lessons, words) {
    C[book] = C[book] || [];
    const t = book + 'u' + n;
    C[book].push({ book, n, id: t, en, vi, focus, lessons, words: words.map(w => w[0]) });
    EQ.TOPICS[t] = (book === 'gs6' ? 'Lớp 6' : 'Lớp 8') + ' – Unit ' + n + ': ' + en;
    words.forEach(w => {
      const o = { id: w[0], en: w[1], vi: w[2], e: w[3], ex: w[4], exVi: w[5], t, r: 'book', pic: w[6] !== false, book, unit: n };
      EQ.VOCAB.push(o);
      EQ.V[o.id] = o;
    });
  }
  const F = false; // không dùng cho câu hỏi chọn hình

  // ======================= TIẾNG ANH 6 – GLOBAL SUCCESS =======================
  unit('gs6', 1, 'My New School', 'Trường mới của em', 'Hiện tại đơn, hiện tại tiếp diễn; động từ play/do/study/have', ['present', 'tobe'], [
    ['uniform', 'uniform', 'đồng phục', '👕', 'We wear a uniform at school.', 'Chúng mình mặc đồng phục ở trường.'],
    ['homework', 'homework', 'bài tập về nhà', '📝', 'I do my homework every evening.', 'Mình làm bài tập về nhà mỗi tối.', F],
    ['science', 'science', 'môn khoa học', '🔬', 'I have science on Monday.', 'Mình có môn khoa học vào thứ Hai.'],
    ['music', 'music', 'âm nhạc', '🎵', 'I like music.', 'Mình thích âm nhạc.'],
    ['art', 'art', 'môn mĩ thuật', '🖌️', 'Art is my favourite subject.', 'Mĩ thuật là môn học yêu thích của mình.'],
    ['history', 'history', 'môn lịch sử', '📜', 'We study history on Friday.', 'Chúng mình học lịch sử vào thứ Sáu.', F],
    ['maths', 'maths', 'môn toán', '➗', 'Maths is difficult but interesting.', 'Môn toán khó nhưng thú vị.'],
    ['lesson', 'lesson', 'bài học, tiết học', '📗', 'Our first lesson starts at seven.', 'Tiết học đầu tiên bắt đầu lúc bảy giờ.', F],
    ['calculator', 'calculator', 'máy tính cầm tay', '🧮', 'I use a calculator in maths.', 'Mình dùng máy tính cầm tay trong giờ toán.', F]
  ]);
  unit('gs6', 2, 'My House', 'Ngôi nhà của em', 'Sở hữu cách; giới từ chỉ vị trí; There is / There are', ['prep', 'tobe'], [
    ['living_room', 'living room', 'phòng khách', '🛋️', 'We watch TV in the living room.', 'Chúng mình xem ti vi ở phòng khách.', F],
    ['kitchen', 'kitchen', 'nhà bếp', '🍽️', 'My mother is in the kitchen.', 'Mẹ mình đang ở trong bếp.', F],
    ['bedroom', 'bedroom', 'phòng ngủ', '🛏️', 'My bedroom is small.', 'Phòng ngủ của mình nhỏ.', F],
    ['bathroom', 'bathroom', 'phòng tắm', '🛁', 'The bathroom is next to my bedroom.', 'Phòng tắm ở bên cạnh phòng ngủ của mình.'],
    ['sofa', 'sofa', 'ghế sô-pha', '🛋️', 'There is a big sofa in the living room.', 'Có một cái ghế sô-pha lớn trong phòng khách.', F],
    ['lamp', 'lamp', 'cái đèn', '💡', 'There is a lamp on my desk.', 'Có một cái đèn trên bàn học của mình.'],
    ['fridge', 'fridge', 'tủ lạnh', '🧊', 'The milk is in the fridge.', 'Sữa ở trong tủ lạnh.', F],
    ['picture', 'picture', 'bức tranh, bức ảnh', '🖼️', 'There are two pictures on the wall.', 'Có hai bức tranh trên tường.'],
    ['flat', 'flat', 'căn hộ', '🏢', 'We live in a flat in the city.', 'Chúng mình sống trong một căn hộ ở thành phố.'],
    ['garden', 'garden', 'khu vườn', '🌷', 'My grandparents have a small garden.', 'Ông bà mình có một khu vườn nhỏ.']
  ]);
  unit('gs6', 3, 'My Friends', 'Bạn bè của em', 'Tính từ tả ngoại hình, tính cách; hiện tại tiếp diễn nói kế hoạch', ['tobe', 'have'], [
    ['tall', 'tall', 'cao', '📐', 'My brother is tall.', 'Anh trai mình cao.', F],
    ['kind', 'kind', 'tốt bụng', '💗', 'My best friend is very kind.', 'Bạn thân của mình rất tốt bụng.', F],
    ['funny', 'funny', 'hài hước, buồn cười', '😂', 'Nam is funny. He makes us laugh.', 'Nam hài hước. Bạn ấy làm chúng mình cười.'],
    ['clever', 'clever', 'thông minh', '🧠', 'Mai is clever. She is good at maths.', 'Mai thông minh. Bạn ấy giỏi toán.'],
    ['shy', 'shy', 'nhút nhát', '🙈', 'She is shy. She does not talk much.', 'Bạn ấy nhút nhát. Bạn ấy không nói nhiều.'],
    ['glasses', 'glasses', 'kính đeo mắt', '👓', 'He wears glasses.', 'Bạn ấy đeo kính.'],
    ['friendly', 'friendly', 'thân thiện', '🤗', 'The new student is friendly.', 'Bạn học sinh mới rất thân thiện.', F],
    ['creative', 'creative', 'sáng tạo', '💡', 'Lan is creative. She draws very well.', 'Lan sáng tạo. Bạn ấy vẽ rất đẹp.', F],
    ['hard_working', 'hard-working', 'chăm chỉ', '💪', 'Minh is hard-working.', 'Minh rất chăm chỉ.', F]
  ]);
  unit('gs6', 4, 'My Neighbourhood', 'Khu phố của em', 'So sánh hơn của tính từ', ['tobe'], [
    ['park', 'park', 'công viên', '🌳', 'There is a big park near my house.', 'Có một công viên lớn gần nhà mình.'],
    ['museum', 'museum', 'bảo tàng', '🏛️', 'We visit the museum on Sunday.', 'Chúng mình đi thăm bảo tàng vào Chủ nhật.'],
    ['temple', 'temple', 'ngôi đền, chùa', '🛕', 'There is an old temple in my village.', 'Có một ngôi đền cổ trong làng mình.'],
    ['station', 'railway station', 'nhà ga xe lửa', '🚉', 'The railway station is very busy.', 'Nhà ga xe lửa rất đông đúc.'],
    ['noisy', 'noisy', 'ồn ào', '📢', 'The street is noisy.', 'Con phố này ồn ào.', F],
    ['quiet', 'quiet', 'yên tĩnh', '🤫', 'My village is quieter than the city.', 'Làng mình yên tĩnh hơn thành phố.', F],
    ['crowded', 'crowded', 'đông đúc', '👥', 'The market is crowded in the morning.', 'Chợ đông đúc vào buổi sáng.', F],
    ['modern', 'modern', 'hiện đại', '🏙️', 'Ha Noi has many modern buildings.', 'Hà Nội có nhiều tòa nhà hiện đại.', F],
    ['square', 'square', 'quảng trường', '⬜', 'People walk in the square in the evening.', 'Mọi người đi dạo ở quảng trường vào buổi tối.', F]
  ]);
  unit('gs6', 5, 'Natural Wonders of Viet Nam', 'Kỳ quan thiên nhiên Việt Nam', 'Danh từ đếm được / không đếm được; must / mustn\'t', ['can'], [
    ['mountain', 'mountain', 'ngọn núi', '⛰️', 'Fansipan is a high mountain.', 'Phan-xi-păng là một ngọn núi cao.'],
    ['river', 'river', 'con sông', '🏞️', 'The Red River is very long.', 'Sông Hồng rất dài.'],
    ['beach', 'beach', 'bãi biển', '🏖️', 'We go to the beach in summer.', 'Chúng mình đi biển vào mùa hè.'],
    ['island', 'island', 'hòn đảo', '🏝️', 'Ha Long Bay has many islands.', 'Vịnh Hạ Long có nhiều hòn đảo.'],
    ['cave', 'cave', 'hang động', '🕳️', 'Son Doong is a very big cave.', 'Sơn Đoòng là một hang động rất lớn.', F],
    ['forest', 'forest', 'khu rừng', '🌲', 'Cuc Phuong is a beautiful forest.', 'Cúc Phương là một khu rừng đẹp.'],
    ['desert', 'desert', 'sa mạc', '🏜️', 'It is very hot in the desert.', 'Ở sa mạc rất nóng.'],
    ['waterfall', 'waterfall', 'thác nước', '💦', 'Ban Gioc is a famous waterfall.', 'Bản Giốc là một thác nước nổi tiếng.', F],
    ['must', 'must', 'phải (bắt buộc)', '❗', 'You must take a map.', 'Bạn phải mang theo bản đồ.', F]
  ]);
  unit('gs6', 6, 'Our Tet Holiday', 'Ngày Tết của chúng em', 'should / shouldn\'t; some / any', ['present'], [
    ['firework', 'fireworks', 'pháo hoa', '🎆', 'We watch fireworks on New Year\'s Eve.', 'Chúng mình xem pháo hoa vào đêm Giao thừa.'],
    ['lucky_money', 'lucky money', 'tiền lì xì', '🧧', 'Children get lucky money at Tet.', 'Trẻ em được nhận tiền lì xì vào dịp Tết.'],
    ['peach_flower', 'peach flower', 'hoa đào', '🌸', 'We buy peach flowers for Tet.', 'Chúng mình mua hoa đào để đón Tết.'],
    ['wish', 'wish', 'lời chúc; ước', '🌟', 'I wish you a happy new year!', 'Chúc bạn năm mới vui vẻ!', F],
    ['decorate', 'decorate', 'trang trí', '🎀', 'We decorate our house before Tet.', 'Chúng mình trang trí nhà trước Tết.', F],
    ['relative', 'relative', 'họ hàng', '👨‍👩‍👧‍👦', 'We visit our relatives at Tet.', 'Chúng mình đi thăm họ hàng vào dịp Tết.', F],
    ['should', 'should', 'nên', '👍', 'You should clean your room.', 'Bạn nên dọn phòng của mình.', F],
    ['new_year', 'New Year', 'năm mới', '🎊', 'Happy New Year!', 'Chúc mừng năm mới!', F]
  ]);
  unit('gs6', 7, 'Television', 'Truyền hình', 'Từ để hỏi (Wh-questions); liên từ and, but, so', ['dodoes'], [
    ['channel', 'channel', 'kênh truyền hình', '📡', 'VTV3 is my favourite channel.', 'VTV3 là kênh yêu thích của mình.', F],
    ['programme', 'programme', 'chương trình (TV)', '📺', 'This programme is for children.', 'Chương trình này dành cho trẻ em.', F],
    ['cartoon', 'cartoon', 'phim hoạt hình', '🐭', 'I like watching cartoons.', 'Mình thích xem phim hoạt hình.', F],
    ['news', 'news', 'tin tức, thời sự', '📰', 'My father watches the news every evening.', 'Bố mình xem thời sự mỗi tối.'],
    ['weather_forecast', 'weather forecast', 'dự báo thời tiết', '🌦️', 'The weather forecast says it will rain.', 'Dự báo thời tiết nói trời sẽ mưa.'],
    ['game_show', 'game show', 'chương trình trò chơi', '🎲', 'We watch a game show together.', 'Chúng mình cùng xem một chương trình trò chơi.', F],
    ['viewer', 'viewer', 'người xem', '👀', 'This show has many viewers.', 'Chương trình này có nhiều người xem.', F],
    ['remote_control', 'remote control', 'cái điều khiển', '🎛️', 'Where is the remote control?', 'Cái điều khiển ở đâu?', F]
  ]);
  unit('gs6', 8, 'Sports and Games', 'Thể thao và trò chơi', 'Thì quá khứ đơn; câu mệnh lệnh', ['can'], [
    ['football', 'football', 'bóng đá', '🥅', 'We play football after school.', 'Chúng mình chơi bóng đá sau giờ học.'],
    ['badminton', 'badminton', 'cầu lông', '🏸', 'My mother plays badminton.', 'Mẹ mình chơi cầu lông.'],
    ['volleyball', 'volleyball', 'bóng chuyền', '🏐', 'They play volleyball on the beach.', 'Họ chơi bóng chuyền trên bãi biển.'],
    ['chess', 'chess', 'cờ vua', '♟️', 'Can you play chess?', 'Bạn có biết chơi cờ vua không?'],
    ['table_tennis', 'table tennis', 'bóng bàn', '🏓', 'I play table tennis with my brother.', 'Mình chơi bóng bàn với anh trai.'],
    ['basketball', 'basketball', 'bóng rổ', '🏀', 'He is tall. He plays basketball.', 'Bạn ấy cao. Bạn ấy chơi bóng rổ.'],
    ['karate', 'karate', 'võ karate', '🥋', 'My sister does karate.', 'Chị gái mình tập võ karate.'],
    ['skateboard', 'skateboarding', 'trượt ván', '🛹', 'Skateboarding is fun.', 'Trượt ván thật vui.'],
    ['racket', 'racket', 'cái vợt', '🎾', 'I need a new racket.', 'Mình cần một cái vợt mới.', F]
  ]);
  unit('gs6', 9, 'Cities of the World', 'Các thành phố trên thế giới', 'Tính từ sở hữu, đại từ sở hữu; thì hiện tại hoàn thành (làm quen)', ['tobe'], [
    ['city', 'city', 'thành phố', '🌆', 'Tokyo is a big city.', 'Tô-ky-ô là một thành phố lớn.'],
    ['tower', 'tower', 'tòa tháp', '🗼', 'The Eiffel Tower is in Paris.', 'Tháp Eiffel ở Pa-ri.'],
    ['palace', 'palace', 'cung điện', '🏯', 'The king lives in a palace.', 'Nhà vua sống trong cung điện.'],
    ['famous', 'famous', 'nổi tiếng', '⭐', 'London is famous for its red buses.', 'Luân Đôn nổi tiếng với những chiếc xe buýt đỏ.', F],
    ['capital', 'capital', 'thủ đô', '🏛', 'Ha Noi is the capital of Viet Nam.', 'Hà Nội là thủ đô của Việt Nam.', F],
    ['country', 'country', 'đất nước', '🗺️', 'Japan is a beautiful country.', 'Nhật Bản là một đất nước xinh đẹp.', F],
    ['postcard', 'postcard', 'bưu thiếp', '💌', 'I send you a postcard from Sydney.', 'Mình gửi bạn một tấm bưu thiếp từ Xít-ni.', F],
    ['beautiful', 'beautiful', 'đẹp', '😍', 'Hoi An is a beautiful town.', 'Hội An là một thị trấn đẹp.', F]
  ]);
  unit('gs6', 10, 'Our Houses in the Future', 'Ngôi nhà của chúng ta trong tương lai', 'Thì tương lai đơn (will); might', ['can'], [
    ['solar_energy', 'solar energy', 'năng lượng mặt trời', '☀️', 'Our future house will use solar energy.', 'Ngôi nhà tương lai của chúng mình sẽ dùng năng lượng mặt trời.'],
    ['helicopter', 'helicopter', 'máy bay trực thăng', '🚁', 'We might travel by helicopter.', 'Chúng ta có thể đi lại bằng trực thăng.'],
    ['ufo', 'UFO', 'đĩa bay', '🛸', 'I want to live in a UFO!', 'Mình muốn sống trong một chiếc đĩa bay!'],
    ['ocean', 'ocean', 'đại dương', '🌊', 'There will be houses under the ocean.', 'Sẽ có những ngôi nhà dưới đại dương.'],
    ['dishwasher', 'dishwasher', 'máy rửa bát', '🍽', 'The dishwasher will wash the dishes.', 'Máy rửa bát sẽ rửa bát đĩa.', F],
    ['washing_machine', 'washing machine', 'máy giặt', '🧺', 'The washing machine washes our clothes.', 'Máy giặt giặt quần áo cho chúng mình.', F],
    ['smart', 'smart', 'thông minh (thiết bị)', '📲', 'We will have a smart TV.', 'Chúng mình sẽ có một chiếc ti vi thông minh.', F],
    ['will', 'will', 'sẽ', '🔮', 'I will be a doctor.', 'Mình sẽ trở thành bác sĩ.', F]
  ]);
  unit('gs6', 11, 'Our Greener World', 'Thế giới xanh hơn', 'Mạo từ; câu điều kiện loại 1', ['present'], [
    ['recycle', 'recycle', 'tái chế', '♻️', 'We recycle paper and bottles.', 'Chúng mình tái chế giấy và chai lọ.'],
    ['reuse', 'reuse', 'tái sử dụng', '🔁', 'Reuse your shopping bags.', 'Hãy dùng lại túi mua sắm của bạn.', F],
    ['reduce', 'reduce', 'giảm bớt', '📉', 'We should reduce plastic.', 'Chúng ta nên giảm bớt đồ nhựa.', F],
    ['rubbish', 'rubbish', 'rác', '🗑️', 'Put the rubbish in the bin.', 'Hãy bỏ rác vào thùng.'],
    ['plastic_bag', 'plastic bag', 'túi ni-lông', '🛍️', 'Do not use plastic bags.', 'Đừng dùng túi ni-lông.', F],
    ['plant', 'plant', 'cây; trồng cây', '🌱', 'We plant trees in spring.', 'Chúng mình trồng cây vào mùa xuân.'],
    ['environment', 'environment', 'môi trường', '🌍', 'We must protect the environment.', 'Chúng ta phải bảo vệ môi trường.'],
    ['pollution', 'pollution', 'sự ô nhiễm', '🏭', 'Air pollution is bad for our health.', 'Ô nhiễm không khí có hại cho sức khỏe.']
  ]);
  unit('gs6', 12, 'Robots', 'Người máy', 'could / couldn\'t; can / can\'t (khả năng)', ['can'], [
    ['robot', 'robot', 'người máy', '🤖', 'This robot can make breakfast.', 'Người máy này có thể làm bữa sáng.'],
    ['machine', 'machine', 'máy móc', '⚙️', 'A robot is a machine.', 'Người máy là một cỗ máy.'],
    ['do_dishes', 'do the dishes', 'rửa bát', '🧽', 'Robots can do the dishes.', 'Người máy có thể rửa bát.', F],
    ['do_laundry', 'do the laundry', 'giặt quần áo', '👚', 'I do the laundry on Sunday.', 'Mình giặt quần áo vào Chủ nhật.', F],
    ['iron', 'iron', 'là (ủi) quần áo', '♨️', 'My robot can iron clothes.', 'Người máy của mình có thể là quần áo.', F],
    ['understand', 'understand', 'hiểu', '💭', 'Robots can understand our words.', 'Người máy có thể hiểu lời nói của chúng ta.', F],
    ['could', 'could', 'đã có thể (quá khứ của can)', '⏪', 'I could swim when I was five.', 'Mình đã biết bơi khi lên năm tuổi.', F],
    ['guard_v', 'guard our house', 'canh giữ ngôi nhà', '🛡️', 'Robots can guard our house.', 'Người máy có thể canh giữ nhà của chúng ta.', F]
  ]);

  // ======================= TIẾNG ANH 8 – GLOBAL SUCCESS =======================
  unit('gs8', 1, 'Leisure Time', 'Thời gian rảnh rỗi', 'Động từ chỉ sự yêu thích + V-ing / to V', ['present'], [
    ['leisure', 'leisure time', 'thời gian rảnh rỗi', '🕒', 'What do you do in your leisure time?', 'Bạn làm gì vào thời gian rảnh?', F],
    ['hobby', 'hobby', 'sở thích', '🎯', 'My hobby is reading.', 'Sở thích của mình là đọc sách.', F],
    ['hang_out', 'hang out', 'đi chơi', '🧑‍🤝‍🧑', 'I hang out with my friends at weekends.', 'Mình đi chơi với bạn bè vào cuối tuần.', F],
    ['knit', 'knit', 'đan (len)', '🧶', 'My grandmother likes knitting.', 'Bà mình thích đan len.'],
    ['collect', 'collect', 'sưu tầm', '🗃️', 'He collects stamps.', 'Bạn ấy sưu tầm tem.', F],
    ['bored', 'bored', 'chán', '🥱', 'I feel bored when I stay at home.', 'Mình thấy chán khi ở nhà.'],
    ['relax', 'relax', 'thư giãn', '🧘', 'I relax by listening to music.', 'Mình thư giãn bằng cách nghe nhạc.'],
    ['craft', 'craft', 'đồ thủ công', '✂', 'We make crafts from paper.', 'Chúng mình làm đồ thủ công từ giấy.', F],
    ['surf_net', 'surf the Internet', 'lướt mạng', '🖱️', 'Teenagers love surfing the Internet.', 'Thanh thiếu niên rất thích lướt mạng.', F]
  ]);
  unit('gs8', 2, 'Life in the Countryside', 'Cuộc sống ở nông thôn', 'So sánh hơn của trạng từ', ['tobe'], [
    ['countryside', 'countryside', 'vùng nông thôn', '🏡', 'Life in the countryside is peaceful.', 'Cuộc sống ở nông thôn yên bình.', F],
    ['buffalo', 'buffalo', 'con trâu', '🐃', 'The boy rides a buffalo.', 'Cậu bé cưỡi trâu.'],
    ['paddy_field', 'paddy field', 'ruộng lúa', '🌾', 'The paddy fields are green.', 'Những cánh đồng lúa xanh mướt.'],
    ['harvest', 'harvest', 'thu hoạch; vụ mùa', '🧺', 'Farmers are busy at harvest time.', 'Nông dân bận rộn vào mùa thu hoạch.', F],
    ['farmer', 'farmer', 'nông dân', '👨‍🌾', 'My uncle is a farmer.', 'Chú mình là nông dân.'],
    ['peaceful', 'peaceful', 'yên bình', '🕊', 'My village is very peaceful.', 'Làng mình rất yên bình.', F],
    ['vast', 'vast', 'rộng lớn, bao la', '🌄', 'The fields are vast.', 'Những cánh đồng bao la.', F],
    ['picturesque', 'picturesque', 'đẹp như tranh', '🖼', 'Sa Pa is picturesque.', 'Sa Pa đẹp như tranh.', F],
    ['herd', 'herd', 'chăn (gia súc); đàn', '🐄', 'The children herd the cows.', 'Bọn trẻ chăn bò.', F]
  ]);
  unit('gs8', 3, 'Teenagers', 'Tuổi thiếu niên', 'Câu đơn và câu ghép', ['present', 'neg'], [
    ['teenager', 'teenager', 'thanh thiếu niên', '🧑', 'Teenagers like social media.', 'Thanh thiếu niên thích mạng xã hội.', F],
    ['social_media', 'social media', 'mạng xã hội', '📱', 'Don\'t spend too much time on social media.', 'Đừng dành quá nhiều thời gian cho mạng xã hội.'],
    ['stress', 'stress', 'căng thẳng', '😣', 'Exams cause stress.', 'Các kỳ thi gây căng thẳng.', F],
    ['pressure', 'pressure', 'áp lực', '🏋', 'Students feel pressure from homework.', 'Học sinh cảm thấy áp lực từ bài tập về nhà.', F],
    ['club', 'club', 'câu lạc bộ', '🏅', 'I joined the English club.', 'Mình đã tham gia câu lạc bộ tiếng Anh.', F],
    ['account', 'account', 'tài khoản', '🔐', 'Keep your account password safe.', 'Hãy giữ an toàn mật khẩu tài khoản của bạn.', F],
    ['forum', 'forum', 'diễn đàn', '🗨️', 'We share ideas on a forum.', 'Chúng mình chia sẻ ý kiến trên diễn đàn.', F],
    ['log_on', 'log on', 'đăng nhập', '🔑', 'Log on to the school website.', 'Hãy đăng nhập vào trang web của trường.', F],
    ['focus', 'focus', 'tập trung', '🎯', 'Turn off your phone and focus on your study.', 'Hãy tắt điện thoại và tập trung học.', F]
  ]);
  unit('gs8', 4, 'Ethnic Groups of Viet Nam', 'Các dân tộc Việt Nam', 'Câu hỏi Yes/No và câu hỏi có từ để hỏi', ['dodoes'], [
    ['ethnic_group', 'ethnic group', 'dân tộc', '👘', 'Viet Nam has 54 ethnic groups.', 'Việt Nam có 54 dân tộc.', F],
    ['minority', 'minority', 'thiểu số', '🧑‍🤝‍🧑', 'The Tay are an ethnic minority group.', 'Người Tày là một dân tộc thiểu số.', F],
    ['stilt_house', 'stilt house', 'nhà sàn', '🛖', 'Many families live in stilt houses.', 'Nhiều gia đình sống trong nhà sàn.', F],
    ['costume', 'costume', 'trang phục truyền thống', '👗', 'The Hmong costume is colourful.', 'Trang phục của người Mông rất sặc sỡ.', F],
    ['terraced_field', 'terraced field', 'ruộng bậc thang', '⛰', 'There are terraced fields in Mu Cang Chai.', 'Ở Mù Cang Chải có ruộng bậc thang.', F],
    ['gong', 'gong', 'cồng chiêng', '🥁', 'People play gongs at festivals.', 'Người ta đánh cồng chiêng trong lễ hội.', F],
    ['communal_house', 'communal house', 'nhà rông, nhà văn hóa', '🏠', 'The communal house is in the centre of the village.', 'Nhà rông nằm ở giữa làng.', F],
    ['heritage', 'heritage', 'di sản', '🏺', 'This is our cultural heritage.', 'Đây là di sản văn hóa của chúng ta.', F]
  ]);
  unit('gs8', 5, 'Our Customs and Traditions', 'Phong tục và truyền thống', 'Mạo từ a, an, the', ['this'], [
    ['custom', 'custom', 'phong tục', '🎎', 'It is our custom to visit grandparents at Tet.', 'Theo phong tục, chúng ta thăm ông bà vào dịp Tết.', F],
    ['tradition', 'tradition', 'truyền thống', '📿', 'Making banh chung is a tradition.', 'Gói bánh chưng là một truyền thống.', F],
    ['ancestor', 'ancestor', 'tổ tiên', '🕯️', 'We worship our ancestors.', 'Chúng ta thờ cúng tổ tiên.', F],
    ['festival', 'festival', 'lễ hội', '🎉', 'The Mid-Autumn Festival is fun.', 'Tết Trung thu rất vui.'],
    ['lantern', 'lantern', 'đèn lồng', '🏮', 'Children carry lanterns at the festival.', 'Trẻ em rước đèn lồng trong lễ hội.'],
    ['table_manners', 'table manners', 'phép lịch sự khi ăn', '🍴', 'Good table manners are important.', 'Phép lịch sự khi ăn rất quan trọng.', F],
    ['respect', 'respect', 'tôn trọng', '🙇', 'We respect older people.', 'Chúng ta tôn trọng người lớn tuổi.', F],
    ['follow', 'follow', 'làm theo, tuân theo', '👣', 'We should follow our traditions.', 'Chúng ta nên giữ gìn truyền thống.', F]
  ]);
  unit('gs8', 6, 'Lifestyles', 'Lối sống', 'Thì tương lai đơn; câu điều kiện loại 1', ['present'], [
    ['lifestyle', 'lifestyle', 'lối sống', '🌿', 'A healthy lifestyle is important.', 'Một lối sống lành mạnh rất quan trọng.', F],
    ['habit', 'habit', 'thói quen', '🔄', 'Reading is a good habit.', 'Đọc sách là một thói quen tốt.', F],
    ['online_learning', 'online learning', 'học trực tuyến', '🧑‍💻', 'Online learning is popular now.', 'Học trực tuyến hiện nay rất phổ biến.', F],
    ['fast_food', 'fast food', 'đồ ăn nhanh', '🍔', 'Fast food is not good for you.', 'Đồ ăn nhanh không tốt cho bạn.'],
    ['exercise', 'exercise', 'tập thể dục', '🏋️', 'I exercise every morning.', 'Mình tập thể dục mỗi sáng.'],
    ['healthy', 'healthy', 'lành mạnh, khỏe mạnh', '🥗', 'Eat healthy food.', 'Hãy ăn đồ ăn lành mạnh.'],
    ['greet', 'greet', 'chào hỏi', '🙋‍♀️', 'In Viet Nam, we greet older people first.', 'Ở Việt Nam, chúng ta chào người lớn tuổi trước.', F],
    ['traditional', 'traditional', 'truyền thống (tính từ)', '🏮', 'Ao dai is a traditional dress.', 'Áo dài là trang phục truyền thống.', F]
  ]);
  unit('gs8', 7, 'Environmental Protection', 'Bảo vệ môi trường', 'Câu phức với mệnh đề chỉ thời gian', ['present', 'can'], [
    ['protect', 'protect', 'bảo vệ', '🛡', 'We must protect wild animals.', 'Chúng ta phải bảo vệ động vật hoang dã.', F],
    ['wildlife', 'wildlife', 'động vật hoang dã', '🦌', 'Wildlife is in danger.', 'Động vật hoang dã đang gặp nguy hiểm.', F],
    ['habitat', 'habitat', 'môi trường sống', '🌴', 'Forests are the habitat of many animals.', 'Rừng là môi trường sống của nhiều loài động vật.', F],
    ['endangered', 'endangered', 'có nguy cơ tuyệt chủng', '⚠️', 'Tigers are endangered.', 'Loài hổ đang có nguy cơ tuyệt chủng.', F],
    ['global_warming', 'global warming', 'sự nóng lên toàn cầu', '🌡️', 'Global warming makes the Earth hotter.', 'Sự nóng lên toàn cầu làm Trái Đất nóng hơn.'],
    ['waste', 'waste', 'chất thải; lãng phí', '🚮', 'Factories produce a lot of waste.', 'Các nhà máy thải ra nhiều chất thải.', F],
    ['deforestation', 'deforestation', 'nạn phá rừng', '🪓', 'Deforestation destroys animals\' homes.', 'Nạn phá rừng phá hủy nhà của các loài vật.', F],
    ['carbon_footprint', 'carbon footprint', 'lượng khí thải các-bon', '👣', 'Walking reduces your carbon footprint.', 'Đi bộ giúp giảm lượng khí thải các-bon của bạn.', F]
  ]);
  unit('gs8', 8, 'Shopping', 'Mua sắm', 'Trạng từ chỉ tần suất; hiện tại đơn nói về tương lai', ['present'], [
    ['shopping_centre', 'shopping centre', 'trung tâm mua sắm', '🏬', 'The shopping centre opens at nine.', 'Trung tâm mua sắm mở cửa lúc chín giờ.'],
    ['convenience_store', 'convenience store', 'cửa hàng tiện lợi', '🏪', 'There is a convenience store near my school.', 'Có một cửa hàng tiện lợi gần trường mình.'],
    ['discount', 'discount', 'giảm giá', '🏷️', 'There is a 20% discount today.', 'Hôm nay được giảm giá 20%.'],
    ['customer', 'customer', 'khách hàng', '🧑‍💼', 'The shop has many customers.', 'Cửa hàng có nhiều khách hàng.', F],
    ['bargain', 'bargain', 'mặc cả; món hời', '🤝', 'You can bargain at the market.', 'Bạn có thể mặc cả ở chợ.', F],
    ['online_shopping', 'online shopping', 'mua sắm trực tuyến', '🛒', 'Online shopping is easy.', 'Mua sắm trực tuyến rất dễ dàng.'],
    ['cash', 'cash', 'tiền mặt', '💵', 'Can I pay in cash?', 'Tôi có thể trả bằng tiền mặt không?'],
    ['receipt', 'receipt', 'hóa đơn', '🧾', 'Keep your receipt.', 'Hãy giữ lại hóa đơn của bạn.'],
    ['price', 'price', 'giá cả', '💲', 'What is the price of this shirt?', 'Chiếc áo này giá bao nhiêu?', F]
  ]);
  unit('gs8', 9, 'Natural Disasters', 'Thiên tai', 'Thì quá khứ tiếp diễn', ['present'], [
    ['earthquake', 'earthquake', 'động đất', '🫨', 'The earthquake damaged many houses.', 'Trận động đất đã làm hư hại nhiều ngôi nhà.', F],
    ['flood', 'flood', 'lũ lụt', '🌧️', 'The flood came after heavy rain.', 'Lũ lụt đến sau trận mưa lớn.', F],
    ['storm', 'storm', 'cơn bão', '⛈️', 'A big storm hit the city.', 'Một cơn bão lớn đã đổ bộ vào thành phố.'],
    ['tornado', 'tornado', 'lốc xoáy', '🌪️', 'The tornado was very strong.', 'Cơn lốc xoáy rất mạnh.'],
    ['volcano', 'volcano', 'núi lửa', '🌋', 'The volcano erupted last year.', 'Ngọn núi lửa đã phun trào vào năm ngoái.'],
    ['landslide', 'landslide', 'sạt lở đất', '⛰️', 'The road was closed because of a landslide.', 'Con đường bị đóng vì sạt lở đất.', F],
    ['rescue', 'rescue', 'cứu hộ, giải cứu', '🚑', 'Rescue workers helped the victims.', 'Nhân viên cứu hộ đã giúp các nạn nhân.', F],
    ['shelter', 'shelter', 'nơi trú ẩn', '⛺', 'People stayed in a safe shelter.', 'Mọi người ở trong một nơi trú ẩn an toàn.', F],
    ['damage', 'damage', 'thiệt hại; làm hư hại', '💥', 'The storm caused a lot of damage.', 'Cơn bão gây ra nhiều thiệt hại.', F]
  ]);
  unit('gs8', 10, 'Communication in the Future', 'Giao tiếp trong tương lai', 'Thì tương lai tiếp diễn; giới từ chỉ thời gian, nơi chốn', ['prep'], [
    ['video_conference', 'video conference', 'họp trực tuyến (qua video)', '📹', 'We have a video conference every Monday.', 'Chúng tôi họp trực tuyến mỗi thứ Hai.'],
    ['message', 'message', 'tin nhắn', '💬', 'I sent you a message.', 'Mình đã gửi cho bạn một tin nhắn.'],
    ['smartphone', 'smartphone', 'điện thoại thông minh', '📞', 'My smartphone has a good camera.', 'Điện thoại của mình có máy ảnh tốt.', F],
    ['letter', 'letter', 'lá thư', '✉️', 'My grandfather writes letters.', 'Ông mình viết thư.'],
    ['internet', 'Internet', 'mạng Internet', '🌐', 'We can talk on the Internet.', 'Chúng ta có thể nói chuyện qua mạng Internet.'],
    ['translate', 'translate', 'dịch (ngôn ngữ)', '🈳', 'This app can translate English into Vietnamese.', 'Ứng dụng này có thể dịch tiếng Anh sang tiếng Việt.', F],
    ['telepathy', 'telepathy', 'thần giao cách cảm', '🧠', 'Maybe people will use telepathy in the future.', 'Có lẽ trong tương lai con người sẽ dùng thần giao cách cảm.', F],
    ['hologram', 'hologram', 'hình ảnh ba chiều', '🔮', 'We will talk to holograms.', 'Chúng ta sẽ nói chuyện với hình ảnh ba chiều.', F]
  ]);
  unit('gs8', 11, 'Science and Technology', 'Khoa học và công nghệ', 'Câu tường thuật (câu trần thuật)', ['present'], [
    ['scientist', 'scientist', 'nhà khoa học', '👨‍🔬', 'The scientist works in a lab.', 'Nhà khoa học làm việc trong phòng thí nghiệm.'],
    ['experiment', 'experiment', 'thí nghiệm', '🧪', 'We did an experiment in science class.', 'Chúng mình đã làm thí nghiệm trong giờ khoa học.'],
    ['invention', 'invention', 'phát minh', '💡', 'The phone is a great invention.', 'Điện thoại là một phát minh vĩ đại.', F],
    ['computer', 'computer', 'máy vi tính', '💻', 'I use the computer to study.', 'Mình dùng máy vi tính để học.'],
    ['technology', 'technology', 'công nghệ', '🔧', 'Technology makes life easier.', 'Công nghệ giúp cuộc sống dễ dàng hơn.', F],
    ['discover', 'discover', 'khám phá, phát hiện', '🔎', 'Scientists discover new things.', 'Các nhà khoa học khám phá những điều mới.', F],
    ['laboratory', 'laboratory', 'phòng thí nghiệm', '⚗️', 'The laboratory is on the second floor.', 'Phòng thí nghiệm ở tầng hai.', F],
    ['printer_3d', '3D printer', 'máy in 3D', '🖨️', 'A 3D printer can make toys.', 'Máy in 3D có thể làm đồ chơi.', F]
  ]);
  unit('gs8', 12, 'Life on Other Planets', 'Sự sống trên các hành tinh khác', 'Câu tường thuật (câu hỏi)', ['dodoes'], [
    ['planet', 'planet', 'hành tinh', '🪐', 'Mars is a red planet.', 'Sao Hỏa là một hành tinh màu đỏ.'],
    ['alien', 'alien', 'người ngoài hành tinh', '👽', 'Do you think aliens exist?', 'Bạn có nghĩ người ngoài hành tinh có thật không?'],
    ['spaceship', 'spaceship', 'tàu vũ trụ', '🚀', 'The spaceship flew to the Moon.', 'Con tàu vũ trụ đã bay lên Mặt Trăng.'],
    ['astronaut', 'astronaut', 'phi hành gia', '👨‍🚀', 'I want to be an astronaut.', 'Mình muốn trở thành phi hành gia.'],
    ['galaxy', 'galaxy', 'dải ngân hà, thiên hà', '🌌', 'Our galaxy is called the Milky Way.', 'Thiên hà của chúng ta tên là Ngân Hà.'],
    ['telescope', 'telescope', 'kính thiên văn', '🔭', 'We look at the stars with a telescope.', 'Chúng ta ngắm sao bằng kính thiên văn.'],
    ['gravity', 'gravity', 'trọng lực', '🍎', 'There is less gravity on the Moon.', 'Trên Mặt Trăng có ít trọng lực hơn.', F],
    ['oxygen', 'oxygen', 'khí ô-xy', '🫁', 'People need oxygen to live.', 'Con người cần ô-xy để sống.', F],
    ['surface', 'surface', 'bề mặt', '🌑', 'The surface of Mars is red.', 'Bề mặt sao Hỏa có màu đỏ.', F]
  ]);

  EQ.CURRICULUM = C;
  EQ.BOOKS = { gs6: 'Tiếng Anh 6 – Global Success', gs8: 'Tiếng Anh 8 – Global Success' };
})();
