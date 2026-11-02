'use strict';

/* ================================================
   CATÁLOGO DE ITENS DO MERCADO
   Alimenta as sugestões ao digitar e a escolha automática de categoria.
   Cobre a compra do mês inteiro, inclusive o que não é comida, que é a parte
   fraca das bases de produtos.
   Formato: [nome, categoria, unidade, marcas opcionais separadas por vírgula]
   Cada marca vira uma sugestão própria: "Shampoo" + "Seda" = "Shampoo Seda".
   ================================================ */
const CATALOGO_ITENS = [
    // Frutas
    ['Banana', 'Frutas', 'kg'], ['Maçã', 'Frutas', 'kg'], ['Laranja', 'Frutas', 'kg'],
    ['Limão', 'Frutas', 'kg'], ['Mamão', 'Frutas', 'un'], ['Manga', 'Frutas', 'un'],
    ['Abacaxi', 'Frutas', 'un'], ['Melancia', 'Frutas', 'un'], ['Melão', 'Frutas', 'un'],
    ['Uva', 'Frutas', 'kg'], ['Morango', 'Frutas', 'cx'], ['Pera', 'Frutas', 'kg'],
    ['Abacate', 'Frutas', 'un'], ['Goiaba', 'Frutas', 'kg'], ['Maracujá', 'Frutas', 'kg'],
    ['Tangerina', 'Frutas', 'kg'], ['Coco', 'Frutas', 'un'], ['Kiwi', 'Frutas', 'un'],
    ['Ameixa', 'Frutas', 'kg'], ['Pêssego', 'Frutas', 'kg'], ['Caju', 'Frutas', 'kg'],

    // Verduras e legumes
    ['Alface', 'Verduras', 'un'], ['Tomate', 'Verduras', 'kg'], ['Cebola', 'Verduras', 'kg'],
    ['Alho', 'Verduras', 'g'], ['Batata', 'Verduras', 'kg'], ['Batata-doce', 'Verduras', 'kg'],
    ['Cenoura', 'Verduras', 'kg'], ['Beterraba', 'Verduras', 'kg'], ['Abobrinha', 'Verduras', 'kg'],
    ['Abóbora', 'Verduras', 'kg'], ['Chuchu', 'Verduras', 'kg'], ['Pepino', 'Verduras', 'kg'],
    ['Pimentão', 'Verduras', 'kg'], ['Brócolis', 'Verduras', 'un'], ['Couve', 'Verduras', 'un'],
    ['Couve-flor', 'Verduras', 'un'], ['Repolho', 'Verduras', 'un'], ['Rúcula', 'Verduras', 'un'],
    ['Espinafre', 'Verduras', 'un'], ['Mandioca', 'Verduras', 'kg'], ['Cheiro-verde', 'Verduras', 'un'],
    ['Coentro', 'Verduras', 'un'], ['Cebolinha', 'Verduras', 'un'], ['Salsinha', 'Verduras', 'un'],
    ['Berinjela', 'Verduras', 'kg'], ['Vagem', 'Verduras', 'kg'], ['Quiabo', 'Verduras', 'kg'],
    ['Gengibre', 'Verduras', 'g'], ['Inhame', 'Verduras', 'kg'], ['Milho verde espiga', 'Verduras', 'un'],

    // Carnes e ovos
    ['Carne moída', 'Carnes', 'kg'], ['Patinho', 'Carnes', 'kg'], ['Acém', 'Carnes', 'kg'],
    ['Alcatra', 'Carnes', 'kg'], ['Contrafilé', 'Carnes', 'kg'], ['Picanha', 'Carnes', 'kg'],
    ['Maminha', 'Carnes', 'kg'], ['Fraldinha', 'Carnes', 'kg'], ['Músculo', 'Carnes', 'kg'],
    ['Costela', 'Carnes', 'kg'], ['Peito de frango', 'Carnes', 'kg'], ['Coxa de frango', 'Carnes', 'kg'],
    ['Sobrecoxa de frango', 'Carnes', 'kg'], ['Asa de frango', 'Carnes', 'kg'], ['Frango inteiro', 'Carnes', 'kg'],
    ['Frango', 'Carnes', 'kg', 'Sadia,Seara,Perdigão,Aurora'], ['Linguiça', 'Carnes', 'kg', 'Sadia,Seara,Perdigão,Aurora'],
    ['Linguiça calabresa', 'Carnes', 'kg', 'Sadia,Seara,Perdigão'], ['Bacon', 'Carnes', 'g', 'Sadia,Seara,Perdigão'],
    ['Carne', 'Carnes', 'kg'], ['Carne de porco', 'Carnes', 'kg'], ['Bisteca', 'Carnes', 'kg'],
    ['Bisteca suína', 'Carnes', 'kg'], ['Lombo suíno', 'Carnes', 'kg'], ['Pernil', 'Carnes', 'kg'],
    ['Carne seca', 'Carnes', 'kg'], ['Salsicha', 'Carnes', 'kg', 'Sadia,Seara,Perdigão,Aurora'],
    ['Peixe', 'Carnes', 'kg'], ['Tilápia', 'Carnes', 'kg'], ['Salmão', 'Carnes', 'kg'],
    ['Merluza', 'Carnes', 'kg'], ['Camarão', 'Carnes', 'kg'],
    ['Ovos', 'Carnes', 'dz'], ['Ovos de codorna', 'Carnes', 'dz'],

    // Laticínios e frios
    ['Leite', 'Laticínios', 'L', 'Italac,Piracanjuba,Parmalat,Ninho,Elegê,Itambé,Batavo'],
    ['Leite integral', 'Laticínios', 'L', 'Italac,Piracanjuba,Parmalat,Itambé'],
    ['Leite desnatado', 'Laticínios', 'L', 'Italac,Piracanjuba,Parmalat'],
    ['Leite semidesnatado', 'Laticínios', 'L', 'Italac,Piracanjuba,Parmalat'],
    ['Leite sem lactose', 'Laticínios', 'L', 'Piracanjuba,Italac,Parmalat'],
    ['Leite condensado', 'Laticínios', 'un', 'Moça,Italac,Piracanjuba,Itambé'],
    ['Leite em pó', 'Laticínios', 'un', 'Ninho,Italac,Itambé,Piracanjuba'],
    ['Creme de leite', 'Laticínios', 'un', 'Nestlé,Italac,Piracanjuba,Itambé'],
    ['Iogurte', 'Laticínios', 'un', 'Danone,Nestlé,Batavo,Vigor,Activia,Corpus,Yakult'],
    ['Leite fermentado', 'Laticínios', 'un', 'Yakult,Chamyto'],
    ['Requeijão', 'Laticínios', 'un', 'Catupiry,Vigor,Itambé,Nestlé,Danúbio'],
    ['Queijo', 'Laticínios', 'g'], ['Queijo muçarela', 'Laticínios', 'g'], ['Queijo minas', 'Laticínios', 'g'],
    ['Queijo prato', 'Laticínios', 'g'], ['Queijo coalho', 'Laticínios', 'un'], ['Queijo parmesão', 'Laticínios', 'g'],
    ['Queijo ralado', 'Laticínios', 'un', 'Vigor,Faixa Azul'], ['Cream cheese', 'Laticínios', 'un', 'Philadelphia,Polenghi'],
    ['Manteiga', 'Laticínios', 'un', 'Aviação,Itambé,President,Vigor'],
    ['Margarina', 'Laticínios', 'un', 'Qualy,Doriana,Delícia,Claybom'],
    ['Presunto', 'Laticínios', 'g', 'Sadia,Seara,Perdigão,Aurora'],
    ['Peito de peru', 'Laticínios', 'g', 'Sadia,Seara,Perdigão'], ['Mortadela', 'Laticínios', 'g', 'Sadia,Seara,Perdigão,Ceratti'],
    ['Salame', 'Laticínios', 'g', 'Sadia,Seara,Perdigão'],

    // Padaria
    ['Pão francês', 'Padaria', 'un'], ['Pão de forma', 'Padaria', 'pct', 'Pullman,Wickbold,Visconti,Seven Boys'],
    ['Pão integral', 'Padaria', 'pct', 'Pullman,Wickbold,Visconti'], ['Pão de queijo', 'Padaria', 'pct', 'Forno de Minas'],
    ['Pão de hot dog', 'Padaria', 'pct'], ['Pão de hambúrguer', 'Padaria', 'pct'], ['Pão', 'Padaria', 'un'],
    ['Bisnaguinha', 'Padaria', 'pct', 'Seven Boys,Pullman,Wickbold'], ['Bolo', 'Padaria', 'un', 'Bauducco,Ana Maria,Pullman'],
    ['Torrada', 'Padaria', 'pct', 'Bauducco,Magic Toast,Marilan'], ['Sonho', 'Padaria', 'un'], ['Rosca', 'Padaria', 'un'],
    ['Mistura para bolo', 'Padaria', 'pct', 'Dona Benta,Fleischmann,Sol'],

    // Bebidas
    ['Água mineral', 'Bebidas', 'L', 'Crystal,Bonafont,Minalba,Lindoya'], ['Água com gás', 'Bebidas', 'un', 'Crystal,Perrier'],
    ['Galão de água', 'Bebidas', 'un'], ['Refrigerante', 'Bebidas', 'L', 'Coca-Cola,Guaraná Antarctica,Pepsi,Fanta,Sprite,Dolly,Kuat,Sukita'],
    ['Coca-Cola', 'Bebidas', 'L'], ['Coca-Cola Zero', 'Bebidas', 'L'], ['Guaraná', 'Bebidas', 'L', 'Antarctica,Kuat,Jesus'],
    ['Suco', 'Bebidas', 'L', 'Del Valle,Maguary,Ades,Dafruta,Tial,Natural One'], ['Suco de laranja', 'Bebidas', 'L'],
    ['Suco de uva', 'Bebidas', 'L', 'Aurora,Casa de Bento,Maguary'], ['Suco de caixinha', 'Bebidas', 'un', 'Del Valle,Maguary,Ades,Dafruta'],
    ['Suco em pó', 'Bebidas', 'un', 'Tang,Clight,Mid,Fresh'], ['Refresco em pó', 'Bebidas', 'un', 'Tang,Clight,Mid,Fresh'],
    ['Cerveja', 'Bebidas', 'un', 'Skol,Brahma,Antarctica,Heineken,Amstel,Itaipava,Budweiser,Stella Artois,Original,Corona'],
    ['Vinho', 'Bebidas', 'un', 'Pérgola,Almadén,Miolo,Salton,Santa Helena'], ['Espumante', 'Bebidas', 'un', 'Chandon,Salton,Miolo'],
    ['Energético', 'Bebidas', 'un', 'Red Bull,Monster,TNT,Fusion'], ['Chá gelado', 'Bebidas', 'un', 'Matte Leão,Lipton'],
    ['Chá mate', 'Bebidas', 'un', 'Matte Leão'], ['Água de coco', 'Bebidas', 'un', 'Kero Coco,Obrigado,Sococo'],
    ['Isotônico', 'Bebidas', 'un', 'Gatorade,Powerade'], ['Gatorade', 'Bebidas', 'un'],
    ['Vodka', 'Bebidas', 'un', 'Smirnoff,Absolut,Orloff,Natasha'], ['Cachaça', 'Bebidas', 'un', '51,Velho Barreiro,Ypióca,Pitu'],
    ['Whisky', 'Bebidas', 'un', 'Johnnie Walker,Jack Daniels,Chivas,Passport,Old Parr'], ['Gin', 'Bebidas', 'un', 'Tanqueray,Beefeater,Gordons'],

    // Limpeza
    ['Detergente', 'Limpeza', 'un', 'Ypê,Limpol,Minuano,Assim'],
    ['Lava-louças', 'Limpeza', 'un', 'Ypê,Limpol,Minuano,Finish'], ['Sabão para louça', 'Limpeza', 'un', 'Ypê,Limpol,Finish'],
    ['Sabão em pó', 'Limpeza', 'un', 'Omo,Ariel,Brilhante,Tixan Ypê,Surf,Ace,Ypê,Assim'],
    ['Sabão líquido', 'Limpeza', 'un', 'Omo,Ariel,Brilhante,Tixan Ypê,Surf,Ypê'],
    ['Lava-roupas', 'Limpeza', 'un', 'Omo,Ariel,Brilhante,Tixan Ypê,Surf,Ypê'],
    ['Sabão em barra', 'Limpeza', 'un', 'Ypê,Minuano,Omo,Barra Azul,Assim'], ['Sabão de coco', 'Limpeza', 'un', 'Ypê,Minuano,Coco Babaçu,Razzo'],
    ['Amaciante', 'Limpeza', 'un', 'Comfort,Downy,Ypê,Fofo,Mon Bijou,Minuano,Baby Soft'],
    ['Alvejante', 'Limpeza', 'un', 'Vanish,Qboa,Ypê,Ace,Brilhante'], ['Tira-manchas', 'Limpeza', 'un', 'Vanish,Ypê,Ace,Omo'],
    ['Água sanitária', 'Limpeza', 'L', 'Qboa,Ypê,Super Globo,Clorox,Candida'],
    ['Desinfetante', 'Limpeza', 'L', 'Pinho Sol,Veja,Ypê,Lysoform,Pato,Harpic,Pinho Bril,Minuano,Kalipto'],
    ['Pinho Sol', 'Limpeza', 'L'], ['Lysoform', 'Limpeza', 'un'],
    ['Multiuso', 'Limpeza', 'un', 'Veja,Ypê,Mr Músculo,Ajax,Cif'], ['Limpador multiuso', 'Limpeza', 'un', 'Veja,Ypê,Ajax'],
    ['Limpa-vidros', 'Limpeza', 'un', 'Veja,Vidrex,Mr Músculo,Ajax'], ['Limpa-pisos', 'Limpeza', 'un', 'Veja,Ypê,Ajax'],
    ['Limpa-alumínio', 'Limpeza', 'un', 'Ypê,Brilux,Cif'], ['Limpa-forno', 'Limpeza', 'un', 'Mr Músculo,Veja'],
    ['Limpa-carpete', 'Limpeza', 'un', 'Vanish,Veja'], ['Limpa-banheiro', 'Limpeza', 'un', 'Veja,Harpic,Pato,Mr Músculo'],
    ['Tira-limo', 'Limpeza', 'un', 'Veja,Ypê,Mr Músculo'], ['Tira-gordura', 'Limpeza', 'un', 'Veja,Mr Músculo,Ajax'],
    ['Saponáceo', 'Limpeza', 'un', 'Cif,Radium,Sapólio'], ['Cif', 'Limpeza', 'un'],
    ['Pedra sanitária', 'Limpeza', 'un', 'Pato,Harpic,Sanol,Veja'], ['Desentupidor', 'Limpeza', 'un', 'Diabo Verde,Sanol,Mr Músculo'],
    ['Odorizador', 'Limpeza', 'un', 'Bom Ar,Glade,Air Wick,Ypê'], ['Aromatizador', 'Limpeza', 'un', 'Bom Ar,Glade,Air Wick,Ypê'],
    ['Bom Ar', 'Limpeza', 'un'], ['Lustra-móveis', 'Limpeza', 'un', 'Peroba,Poliflor,Ypê,Bravo'], ['Cera', 'Limpeza', 'un', 'Bravo,Poliflor,Grand Prix'],
    ['Esponja', 'Limpeza', 'pct', 'Scotch-Brite,Bombril,Assolan,Ypê'], ['Esponja de aço', 'Limpeza', 'pct', 'Bombril,Assolan,Ypê'],
    ['Palha de aço', 'Limpeza', 'pct', 'Bombril,Assolan,Ypê'], ['Bombril', 'Limpeza', 'pct'],
    ['Pano de chão', 'Limpeza', 'un'], ['Pano de prato', 'Limpeza', 'un'], ['Pano multiuso', 'Limpeza', 'pct', 'Perfex,Scotch-Brite'],
    ['Perfex', 'Limpeza', 'pct'], ['Flanela', 'Limpeza', 'un'], ['Vassoura', 'Limpeza', 'un', 'Condor,Bettanin,Noviça'],
    ['Rodo', 'Limpeza', 'un', 'Condor,Bettanin,Noviça'], ['Pá de lixo', 'Limpeza', 'un', 'Condor,Bettanin'], ['Balde', 'Limpeza', 'un'],
    ['Escova de roupa', 'Limpeza', 'un'], ['Luva de borracha', 'Limpeza', 'un', 'Scotch-Brite'], ['Mop', 'Limpeza', 'un', 'Flash Limp'],
    ['Saco de lixo', 'Limpeza', 'pct', 'Dover Roll,Embalixo'], ['Saco plástico', 'Limpeza', 'pct'],
    ['Lixeira', 'Limpeza', 'un'], ['Prendedor de roupa', 'Limpeza', 'pct'], ['Varal', 'Limpeza', 'un'],
    ['Inseticida', 'Limpeza', 'un', 'SBP,Raid,Baygon,Mat Inset,Rodasol'], ['Naftalina', 'Limpeza', 'pct'],
    ['Álcool', 'Limpeza', 'un', 'Zulu,Itajá'], ['Papel-toalha', 'Limpeza', 'pct', 'Snob,Kitchen,Scott,Personal'],
    ['Papel-alumínio', 'Limpeza', 'un', 'Wyda'], ['Filme plástico', 'Limpeza', 'un', 'Wyda,Royalpack'],

    // Higiene
    ['Papel higiênico', 'Higiene', 'pct', 'Neve,Personal,Scott,Sublime,Mili,Paloma,Cotton,Duetto'],
    ['Sabonete', 'Higiene', 'un', 'Dove,Lux,Protex,Palmolive,Nivea,Rexona,Francis,Phebo,Granado,Johnsons,Albany,Senador'],
    ['Sabonete líquido', 'Higiene', 'un', 'Dove,Lux,Protex,Palmolive,Nivea,Francis,Lifebuoy,Granado'],
    ['Shampoo', 'Higiene', 'un', 'Seda,Pantene,Elseve,Dove,Clear,Head & Shoulders,TRESemmé,Palmolive,Niely,Salon Line,Johnsons,Garnier Fructis,Nivea,Herbal Essences,Darling,Kolene'],
    ['Shampoo infantil', 'Bebê', 'un', 'Johnsons,Turma da Mônica,Granado,Natura,Huggies'],
    ['Condicionador', 'Higiene', 'un', 'Seda,Pantene,Elseve,Dove,Clear,TRESemmé,Palmolive,Niely,Salon Line,Johnsons,Garnier Fructis,Herbal Essences'],
    ['Creme para pentear', 'Higiene', 'un', 'Seda,Elseve,Pantene,Dove,Salon Line,Niely,Skala,Novex,Lola'],
    ['Máscara capilar', 'Higiene', 'un', 'Seda,Elseve,Pantene,Salon Line,Skala,Novex,Lola,Dove'],
    ['Óleo capilar', 'Higiene', 'un', 'Elseve,Salon Line,Pantene'], ['Tintura de cabelo', 'Higiene', 'un', 'Koleston,Garnier Nutrisse,Imédia,Biocolor,Cor & Ton,Niely Gold,Wella'],
    ['Gel de cabelo', 'Higiene', 'un', 'Bozzano,Salon Line'], ['Pomada para cabelo', 'Higiene', 'un', 'Bozzano,Salon Line'],
    ['Creme dental', 'Higiene', 'un', 'Colgate,Sorriso,Oral-B,Close Up,Sensodyne,Crest,Dental Clean'],
    ['Pasta de dente', 'Higiene', 'un', 'Colgate,Sorriso,Oral-B,Close Up,Sensodyne'],
    ['Escova de dente', 'Higiene', 'un', 'Colgate,Oral-B,Sorriso,Condor,Curaprox'], ['Fio dental', 'Higiene', 'un', 'Colgate,Oral-B,Johnsons,Sanifill'],
    ['Enxaguante bucal', 'Higiene', 'un', 'Listerine,Colgate Plax,Oral-B,Cepacol,Close Up'],
    ['Desodorante', 'Higiene', 'un', 'Rexona,Dove,Nivea,Axe,Above,Avanço,Monange,Herbíssimo,Old Spice,Bozzano,Gillette'],
    ['Desodorante aerosol', 'Higiene', 'un', 'Rexona,Dove,Nivea,Axe,Above,Monange'],
    ['Desodorante roll-on', 'Higiene', 'un', 'Rexona,Dove,Nivea,Avanço'], ['Antitranspirante', 'Higiene', 'un', 'Rexona,Dove,Nivea'],
    ['Absorvente', 'Higiene', 'pct', 'Always,Intimus,Sempre Livre,Carefree,Plim'], ['Absorvente noturno', 'Higiene', 'pct', 'Always,Intimus'],
    ['Absorvente interno', 'Higiene', 'pct', 'Tampax,OB,Intimus'], ['Protetor diário', 'Higiene', 'pct', 'Carefree,Intimus,Always,Sempre Livre'],
    ['Sabonete íntimo', 'Higiene', 'un', 'Dermacyd,Intimus,Lucretin,Nivea'], ['Lenço de papel', 'Higiene', 'pct', 'Kleenex,Softys'],
    ['Cotonete', 'Higiene', 'cx', 'Johnsons,Topz,Cremer'], ['Algodão', 'Higiene', 'pct', 'Cremer,Topz,Apolo'],
    ['Hidratante', 'Higiene', 'un', 'Nivea,Dove,Neutrogena,Monange,Vasenol,Natura,Johnsons'], ['Creme para as mãos', 'Higiene', 'un', 'Nivea,Neutrogena,Natura'],
    ['Protetor solar', 'Higiene', 'un', 'Sundown,Nivea,Neutrogena,La Roche-Posay,Episol'], ['Repelente', 'Higiene', 'un', 'Off,Exposis,Repelex,SBP'],
    ['Aparelho de barbear', 'Higiene', 'un', 'Gillette,Bic,Prestobarba,Schick'], ['Prestobarba', 'Higiene', 'un', 'Gillette,Bic'], ['Lâmina de barbear', 'Higiene', 'pct', 'Gillette,Mach3,Bic'],
    ['Gillette', 'Higiene', 'un'], ['Espuma de barbear', 'Higiene', 'un', 'Gillette,Bozzano,Nivea Men,Williams'], ['Gel de barbear', 'Higiene', 'un', 'Gillette,Bozzano,Nivea Men'],
    ['Pós-barba', 'Higiene', 'un', 'Bozzano,Nivea Men,Gillette'], ['Perfume', 'Higiene', 'un', 'Natura,O Boticário,Avon,Eudora,Jequiti'], ['Colônia', 'Higiene', 'un', 'Natura,O Boticário,Avon,Johnsons,Giovanna Baby'],
    ['Esmalte', 'Higiene', 'un', 'Risqué,Colorama,Impala,Dailus,Ana Hickmann'], ['Acetona', 'Higiene', 'un', 'Farmax,Fiorucci'], ['Removedor de esmalte', 'Higiene', 'un', 'Farmax,Colorama'],
    ['Lixa de unha', 'Higiene', 'un'], ['Alicate de unha', 'Higiene', 'un', 'Mundial,Marco Boni'], ['Talco', 'Higiene', 'un', 'Barla,Johnsons,Granado,Avon'], ['Demaquilante', 'Higiene', 'un', 'Nivea,Neutrogena,Garnier,Bioré'],
    ['Água micelar', 'Higiene', 'un', 'Garnier,Nivea,L\'Oréal'], ['Sabonete facial', 'Higiene', 'un', 'Neutrogena,Bioré,Nivea,Asepxia,Garnier'], ['Pente', 'Higiene', 'un'], ['Escova de cabelo', 'Higiene', 'un'],

    // Bebê
    ['Fralda', 'Bebê', 'pct', 'Pampers,Huggies,Turma da Mônica,MamyPoko,Babysec,Personal'], ['Fralda RN', 'Bebê', 'pct', 'Pampers,Huggies'],
    ['Fralda P', 'Bebê', 'pct', 'Pampers,Huggies'], ['Fralda M', 'Bebê', 'pct', 'Pampers,Huggies'], ['Fralda G', 'Bebê', 'pct', 'Pampers,Huggies'], ['Fralda XG', 'Bebê', 'pct', 'Pampers,Huggies'],
    ['Lenço umedecido', 'Bebê', 'pct', 'Pampers,Huggies,Johnsons,Turma da Mônica,Personal'], ['Pomada de assadura', 'Bebê', 'un', 'Bepantol Baby,Hipoglós,Dermodex,Desitin,Johnsons'],
    ['Sabonete infantil', 'Bebê', 'un', 'Johnsons,Granado,Turma da Mônica,Natura'], ['Óleo infantil', 'Bebê', 'un', 'Johnsons'], ['Colônia infantil', 'Bebê', 'un', 'Johnsons,Giovanna Baby,Natura'],
    ['Leite infantil', 'Bebê', 'un', 'Nan,Aptamil,Ninho,Enfamil,Nestogeno'], ['Fórmula infantil', 'Bebê', 'un', 'Nan,Aptamil,Enfamil,Nestogeno'],
    ['Farinha láctea', 'Bebê', 'un', 'Nestlé,Mucilon'], ['Mucilon', 'Bebê', 'un', 'Arroz,Milho,Multicereais'], ['Cereal infantil', 'Bebê', 'un', 'Mucilon,Nestlé,Neston'], ['Papinha', 'Bebê', 'un', 'Nestlé,Heinz'],
    ['Mamadeira', 'Bebê', 'un', 'Avent,Lillo,Kuka,NUK,MAM'], ['Chupeta', 'Bebê', 'un', 'Avent,Lillo,Kuka,NUK,MAM'],
    ['Fralda geriátrica', 'Farmácia', 'pct', 'Bigfral,Tena,Plenitud,Confiance'],

    // Pet
    ['Ração', 'Pet', 'kg', 'Pedigree,Whiskas,Golden,Premier,Dog Chow,Friskies,Cat Chow,Royal Canin,Magnus,Special Dog'],
    ['Ração para cachorro', 'Pet', 'kg', 'Pedigree,Golden,Premier,Dog Chow,Royal Canin,Magnus,Special Dog'], ['Ração de cachorro', 'Pet', 'kg', 'Pedigree,Golden,Premier,Dog Chow'],
    ['Ração para gato', 'Pet', 'kg', 'Whiskas,Golden,Premier,Friskies,Cat Chow,Royal Canin'], ['Ração de gato', 'Pet', 'kg', 'Whiskas,Golden,Premier,Friskies,Cat Chow'],
    ['Sachê para gato', 'Pet', 'un', 'Whiskas,Friskies,Golden,Felix'], ['Sachê para cachorro', 'Pet', 'un', 'Pedigree,Dog Chow,Golden'],
    ['Petisco', 'Pet', 'un', 'Pedigree,Whiskas,Dreamies,Keldog'], ['Bifinho', 'Pet', 'un', 'Keldog,Pedigree'],
    ['Areia de gato', 'Pet', 'pct', 'Pipicat,Viva Verde,Chalesco'], ['Tapete higiênico', 'Pet', 'pct', 'Chalesco,Petix,Super Secão'], ['Antipulgas', 'Pet', 'un', 'Frontline,NexGard,Bravecto,Advocate,Simparic'], ['Shampoo pet', 'Pet', 'un', 'Sanol'],

    // Congelados
    ['Sorvete', 'Congelados', 'un', 'Kibon,Nestlé,Häagen-Dazs,Ben & Jerrys'], ['Pizza congelada', 'Congelados', 'un', 'Sadia,Seara,Perdigão'], ['Pizza', 'Congelados', 'un', 'Sadia,Seara,Perdigão'],
    ['Lasanha', 'Congelados', 'un', 'Sadia,Seara,Perdigão'], ['Hambúrguer', 'Congelados', 'cx', 'Sadia,Seara,Perdigão,Aurora'], ['Nuggets', 'Congelados', 'pct', 'Sadia,Seara,Perdigão'],
    ['Empanado de frango', 'Congelados', 'pct', 'Sadia,Seara,Perdigão'], ['Batata congelada', 'Congelados', 'pct', 'McCain,Sadia'], ['Batata frita', 'Congelados', 'pct', 'McCain,Sadia'],
    ['Polpa de fruta', 'Congelados', 'pct', 'De Marchi,Mais Fruta,Dafruta'], ['Açaí', 'Congelados', 'un', 'Frooty,Oakberry'], ['Gelo', 'Congelados', 'pct'], ['Legumes congelados', 'Congelados', 'pct'],

    // Grãos e farinhas
    ['Arroz', 'Grãos', 'pct', 'Tio João,Camil,Prato Fino,Namorado,Urbano,Blue Ville'], ['Arroz integral', 'Grãos', 'pct', 'Tio João,Camil,Urbano'],
    ['Feijão', 'Grãos', 'pct', 'Camil,Kicaldo,Broto Legal,Máximo'], ['Feijão preto', 'Grãos', 'pct', 'Camil,Kicaldo,Broto Legal'], ['Feijão carioca', 'Grãos', 'pct', 'Camil,Kicaldo,Broto Legal'],
    ['Lentilha', 'Grãos', 'pct', 'Camil,Yoki'], ['Grão-de-bico', 'Grãos', 'pct', 'Camil,Yoki'], ['Ervilha', 'Grãos', 'un', 'Quero,Bonduelle,Predilecta,Fugini'], ['Milho verde', 'Grãos', 'un', 'Quero,Bonduelle,Predilecta,Fugini'],
    ['Seleta de legumes', 'Grãos', 'un', 'Quero,Bonduelle'], ['Aveia', 'Grãos', 'un', 'Quaker,Yoki,Nestlé'], ['Granola', 'Grãos', 'pct', 'Mãe Terra,Jasmine,Vitao'], ['Pipoca', 'Grãos', 'pct', 'Yoki,Sinhá'], ['Quinoa', 'Grãos', 'pct', 'Mãe Terra,Vitao'],
    ['Farinha de trigo', 'Grãos', 'pct', 'Dona Benta,Sol,Renata,Anaconda,Rosa Branca'], ['Farinha de mandioca', 'Grãos', 'pct', 'Yoki,Da Terrinha'], ['Farinha de rosca', 'Grãos', 'pct', 'Yoki'], ['Farofa pronta', 'Grãos', 'pct', 'Yoki,Kitano,Pachá'],
    ['Fubá', 'Grãos', 'pct', 'Yoki,Sinhá'], ['Polvilho', 'Grãos', 'pct', 'Yoki,Amafil'], ['Amido de milho', 'Grãos', 'un', 'Maizena,Yoki,Quaker'], ['Maizena', 'Grãos', 'un'], ['Canjica', 'Grãos', 'pct', 'Yoki'],

    // Temperos e molhos
    ['Sal', 'Temperos', 'un', 'Cisne,Lebre'], ['Pimenta', 'Temperos', 'un'], ['Pimenta-do-reino', 'Temperos', 'un', 'Kitano,Bombay'], ['Orégano', 'Temperos', 'un', 'Kitano,Bombay'], ['Colorau', 'Temperos', 'un', 'Kitano'], ['Cominho', 'Temperos', 'un', 'Kitano'], ['Canela', 'Temperos', 'un', 'Kitano'], ['Louro', 'Temperos', 'un'],
    ['Tempero pronto', 'Temperos', 'un', 'Sazón,Knorr,Arisco,Kitano'], ['Sazón', 'Temperos', 'cx'], ['Knorr', 'Temperos', 'cx'], ['Alho em pasta', 'Temperos', 'un', 'Arisco,Kitano'], ['Caldo de galinha', 'Temperos', 'cx', 'Knorr,Maggi,Arisco'], ['Caldo de carne', 'Temperos', 'cx', 'Knorr,Maggi,Arisco'],
    ['Vinagre', 'Temperos', 'un', 'Castelo,Toscano,Minhoto'], ['Azeite', 'Temperos', 'un', 'Gallo,Andorinha,Borges,La Violetera,Carbonell'], ['Maionese', 'Temperos', 'un', 'Hellmanns,Heinz,Quero,Liza,Arisco'], ['Ketchup', 'Temperos', 'un', 'Heinz,Hellmanns,Quero'], ['Mostarda', 'Temperos', 'un', 'Heinz,Hellmanns,Quero'],
    ['Molho de tomate', 'Temperos', 'un', 'Pomarola,Tarantella,Fugini,Heinz,Quero,Elefante,Cirio'], ['Molho shoyu', 'Temperos', 'un', 'Sakura,Kikkoman,Hinomoto'], ['Molho inglês', 'Temperos', 'un', 'Lea & Perrins,Kitano'], ['Molho de pimenta', 'Temperos', 'un', 'Tabasco,Cepêra'], ['Extrato de tomate', 'Temperos', 'un', 'Elefante,Fugini,Quero,Tarantella'],

    // Mercearia
    ['Açúcar', 'Mercearia', 'kg', 'União,Caravelas,Da Barra,Guarani,Itamaraty'], ['Açúcar refinado', 'Mercearia', 'kg', 'União,Caravelas,Guarani'], ['Açúcar cristal', 'Mercearia', 'kg', 'União,Caravelas,Guarani,Da Barra'], ['Adoçante', 'Mercearia', 'un', 'Zero Cal,Finn,Adocyl,Linea,Stevia'],
    ['Café', 'Mercearia', 'pct', 'Pilão,3 Corações,Melitta,Café do Ponto,Pelé,Caboclo,Nescafé,União,Damasco'], ['Café em pó', 'Mercearia', 'pct', 'Pilão,3 Corações,Melitta,Café do Ponto'], ['Café solúvel', 'Mercearia', 'un', 'Nescafé,3 Corações,Pilão'], ['Café em cápsula', 'Mercearia', 'cx', 'Nescafé Dolce Gusto,3 Corações,Nespresso'],
    ['Filtro de café', 'Mercearia', 'cx', 'Melitta,3 Corações,Brigitta'], ['Filtro de papel', 'Mercearia', 'cx', 'Melitta,3 Corações,Brigitta'], ['Óleo', 'Mercearia', 'un', 'Soya,Liza,Concórdia,Cocamar,Salada'], ['Óleo de soja', 'Mercearia', 'un', 'Soya,Liza,Concórdia,Cocamar'], ['Óleo de girassol', 'Mercearia', 'un', 'Liza,Salada'], ['Óleo de milho', 'Mercearia', 'un', 'Liza,Salada'],
    ['Macarrão', 'Mercearia', 'pct', 'Barilla,Adria,Renata,Galo,Petybon,Vitarella,Fortaleza'], ['Espaguete', 'Mercearia', 'pct', 'Barilla,Adria,Renata,Galo,Petybon'], ['Macarrão instantâneo', 'Mercearia', 'un', 'Nissin Miojo,Turma da Mônica,Maggi,Renata'], ['Miojo', 'Mercearia', 'un', 'Nissin'], ['Molho pronto', 'Mercearia', 'un', 'Pomarola,Knorr'],
    ['Biscoito', 'Mercearia', 'pct', 'Bauducco,Trakinas,Oreo,Passatempo,Nestlé,Piraquê,Marilan,Vitarella,Club Social,Tostines,Negresco,Bono'], ['Bolacha', 'Mercearia', 'pct', 'Bauducco,Trakinas,Oreo,Passatempo,Piraquê,Marilan,Vitarella,Club Social,Negresco'], ['Biscoito recheado', 'Mercearia', 'pct', 'Trakinas,Oreo,Passatempo,Negresco,Bono,Bauducco'], ['Biscoito cream cracker', 'Mercearia', 'pct', 'Vitarella,Marilan,Piraquê,Adria'], ['Biscoito de polvilho', 'Mercearia', 'pct', 'Globo,Marilan'], ['Biscoito maisena', 'Mercearia', 'pct', 'Marilan,Piraquê,Vitarella'], ['Wafer', 'Mercearia', 'pct', 'Bauducco,Nestlé,Piraquê'],
    ['Chocolate', 'Mercearia', 'un', 'Lacta,Nestlé,Garoto,Hershey,Lindt,Cacau Show,Kopenhagen,Arcor'], ['Chocolate em pó', 'Mercearia', 'un', 'Garoto,Nestlé,Melken'], ['Achocolatado', 'Mercearia', 'un', 'Nescau,Toddy,Ovomaltine,Italac'], ['Nescau', 'Mercearia', 'un'], ['Toddy', 'Mercearia', 'un'], ['Cereal', 'Mercearia', 'un', 'Sucrilhos,Nesfit,Corn Flakes,Kelloggs,Nescau Cereal,Moça Flakes'], ['Sucrilhos', 'Mercearia', 'un', 'Kelloggs'], ['Barra de cereal', 'Mercearia', 'un', 'Nutry,Trio,Ritter'],
    ['Mel', 'Mercearia', 'un', 'Baldoni,Minamel'], ['Geleia', 'Mercearia', 'un', 'Queensberry,Ritter,Predilecta,Hero'], ['Goiabada', 'Mercearia', 'un', 'Predilecta,Quero'], ['Gelatina', 'Mercearia', 'cx', 'Royal,Dr. Oetker,Sol'], ['Pudim', 'Mercearia', 'cx', 'Royal,Dr. Oetker,Nestlé'], ['Fermento', 'Mercearia', 'un', 'Royal,Dr. Oetker,Fleischmann,Sol'], ['Fermento biológico', 'Mercearia', 'un', 'Fleischmann,Dr. Oetker'], ['Bicarbonato', 'Mercearia', 'un', 'Kitano,Yoki'], ['Coco ralado', 'Mercearia', 'pct', 'Sococo,Mais Coco'], ['Leite de coco', 'Mercearia', 'un', 'Sococo,Mais Coco,Ducoco'], ['Doce de leite', 'Mercearia', 'un', 'Moça,Itambé,Aviação,Nestlé'],
    ['Salgadinho', 'Mercearia', 'pct', 'Doritos,Cheetos,Ruffles,Fandangos,Baconzitos,Pringles,Elma Chips,Lays'], ['Batata chips', 'Mercearia', 'pct', 'Ruffles,Pringles,Lays'], ['Amendoim', 'Mercearia', 'pct', 'Dori,Yoki,Elma Chips,Santa Helena'], ['Castanha', 'Mercearia', 'pct', 'Vitao,Yoki'], ['Paçoca', 'Mercearia', 'pct', 'Paçoquita,Santa Helena'],
    ['Bala', 'Mercearia', 'pct', 'Fini,Halls,Arcor,Dori,Mentos,Tic Tac,Fruittella'], ['Bala de gelatina', 'Mercearia', 'pct', 'Fini,Dori,Haribo'], ['Fini', 'Mercearia', 'pct'], ['Goma', 'Mercearia', 'pct', 'Fini,Haribo'], ['Pirulito', 'Mercearia', 'pct', 'Chupa Chups,Arcor,Dori'], ['Chiclete', 'Mercearia', 'pct', 'Trident,Mentos,Bubbaloo,Plutonita'], ['Marshmallow', 'Mercearia', 'pct', 'Fini,Fiesta'], ['Pastilha', 'Mercearia', 'un', 'Halls,Fini,Mentos,Tic Tac'],
    ['Atum', 'Mercearia', 'un', 'Gomes da Costa,Coqueiro,Pescador'], ['Sardinha', 'Mercearia', 'un', 'Gomes da Costa,Coqueiro,88'], ['Azeitona', 'Mercearia', 'un', 'Vale Fértil,La Violetera,Vitorello'], ['Palmito', 'Mercearia', 'un', 'Marbel,Hemmer,Vale Fértil'], ['Salsicha em lata', 'Mercearia', 'un', 'Bordon,Quero'], ['Chá', 'Mercearia', 'cx', 'Leão,Dr. Oetker,Lipton,Twinings'], ['Chá de camomila', 'Mercearia', 'cx', 'Leão,Dr. Oetker'], ['Erva-mate', 'Mercearia', 'pct', 'Barão,Ximango'],

    // Farmácia
    ['Remédio', 'Farmácia', 'un'], ['Dipirona', 'Farmácia', 'un', 'Novalgina,Neosaldina'], ['Paracetamol', 'Farmácia', 'un', 'Tylenol'], ['Ibuprofeno', 'Farmácia', 'un', 'Advil,Alivium'], ['Antiácido', 'Farmácia', 'un', 'Eno,Estomazil,Sonrisal'], ['Vitamina C', 'Farmácia', 'un', 'Cewin,Redoxon,Cebion'], ['Vitamina', 'Farmácia', 'un', 'Centrum,Lavitan,Redoxon'],
    ['Curativo', 'Farmácia', 'cx', 'Band-Aid,Cremer,Nexcare'], ['Band-Aid', 'Farmácia', 'cx'], ['Esparadrapo', 'Farmácia', 'un', 'Cremer,Nexcare'], ['Gaze', 'Farmácia', 'pct', 'Cremer'], ['Termômetro', 'Farmácia', 'un', 'G-Tech,Omron'], ['Álcool em gel', 'Farmácia', 'un', 'Asseptgel,Zulu,Lifebuoy,Dettol'], ['Soro fisiológico', 'Farmácia', 'un'], ['Preservativo', 'Farmácia', 'cx', 'Jontex,Prudence,Olla,Blowtex'], ['Camisinha', 'Farmácia', 'cx', 'Jontex,Prudence,Olla,Blowtex'], ['Teste de gravidez', 'Farmácia', 'un', 'Clearblue,Confirme'],

    // Casa e descartáveis
    ['Pilha', 'Casa', 'pct', 'Duracell,Rayovac,Elgin,Panasonic'], ['Lâmpada', 'Casa', 'un', 'Philips,Osram,Avant,Elgin'], ['Vela', 'Casa', 'pct'], ['Fósforo', 'Casa', 'cx', 'Fiat Lux,Paraná'], ['Isqueiro', 'Casa', 'un', 'Bic,Clipper'], ['Carvão', 'Casa', 'pct'], ['Álcool para churrasco', 'Casa', 'un'], ['Gás de cozinha', 'Casa', 'un', 'Liquigás,Ultragaz,Supergasbras,Copagaz'],
    ['Guardanapo', 'Casa', 'pct', 'Snob,Kitchen,Scott,Santepel'], ['Copo descartável', 'Casa', 'pct', 'Copobras,Totalplast'], ['Prato descartável', 'Casa', 'pct', 'Copobras,Ultra'], ['Garfo descartável', 'Casa', 'pct', 'Ultra'], ['Colher descartável', 'Casa', 'pct', 'Ultra'], ['Faca descartável', 'Casa', 'pct', 'Ultra'], ['Canudo', 'Casa', 'pct', 'Strawplast'], ['Palito de dente', 'Casa', 'cx', 'Gina,Theoto'], ['Palito de churrasco', 'Casa', 'pct', 'Gina,Theoto'], ['Saco para freezer', 'Casa', 'pct', 'Wyda,Royalpack'], ['Fita adesiva', 'Casa', 'un', 'Scotch,Adelbras'], ['Caneta', 'Casa', 'un', 'Bic,Pilot,Faber-Castell'], ['Lápis', 'Casa', 'un', 'Faber-Castell,Bic'], ['Caderno', 'Casa', 'un', 'Tilibra,Foroni,Jandaia'], ['Pote plástico', 'Casa', 'un', 'Tupperware,Sanremo,Plasútil'], ['Pote', 'Casa', 'un', 'Tupperware,Sanremo,Plasútil'], ['Tupperware', 'Casa', 'un'], ['Assadeira', 'Casa', 'un'], ['Toalha de mesa', 'Casa', 'un'], ['Tomada', 'Casa', 'un'], ['Benjamim', 'Casa', 'un'], ['Extensão', 'Casa', 'un'], ['Pano de limpeza', 'Casa', 'un'],

    // Outros
    ['Sacola retornável', 'Outros', 'un'],
];

// "Maçã " → "maca": compara sem acento, caixa nem apóstrofo
function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ'’]/g, '').toLowerCase().trim();
}

// Só os itens genéricos: as marcas não definem categoria, e "Clear" não pode virar termo
const CATALOGO_GENERICO = CATALOGO_ITENS.map(([nome, categoria, unidade]) => ({ nome, categoria, unidade, chave: normalizar(nome) }));

const CATALOGO = CATALOGO_ITENS.flatMap(([nome, categoria, unidade, marcas]) => [
    { nome, categoria, unidade, chave: normalizar(nome) },
    ...(marcas || '').split(',').filter(Boolean).map(marca => ({
        nome: `${nome} ${marca}`,
        categoria,
        unidade,
        chave: normalizar(`${nome} ${marca}`),
    })),
]);

/* ================================================
   SINÔNIMOS
   Em cada grupo, buscar por um encontra também os outros.
   ================================================ */
const SINONIMOS = [
    ['xampu', 'shampoo'], ['pasta de dente', 'creme dental'], ['enxaguante', 'antisseptico bucal'],
    ['camisinha', 'preservativo'], ['gilete', 'gillette', 'aparelho de barbear'], ['prestobarba', 'aparelho de barbear'],
    ['band aid', 'band-aid', 'curativo'], ['macaxeira', 'aipim', 'mandioca'], ['catchup', 'ketchup'],
    ['maizena', 'amido de milho'], ['miojo', 'macarrao instantaneo'], ['sucrilhos', 'cereal'],
    ['mussarela', 'mucarela', 'muzzarela', 'queijo mucarela'], ['parmesao', 'queijo parmesao'], ['contra file', 'contrafile'],
    ['bolacha', 'biscoito'], ['cream cracker', 'biscoito cream cracker'], ['recheado', 'biscoito recheado'],
    ['refri', 'refrigerante'], ['coca', 'coca-cola'], ['cloro', 'agua sanitaria'], ['candida', 'agua sanitaria'],
    ['perfex', 'pano multiuso'], ['bombril', 'palha de aco', 'esponja de aco'], ['bom ar', 'aromatizador', 'odorizador'],
    ['lava roupa', 'lava-roupas', 'sabao liquido'], ['sabao de roupa', 'sabao em po'], ['sabao omo', 'sabao em po omo'],
    ['veja', 'limpador multiuso veja'], ['filme pvc', 'filme plastico'], ['plastico filme', 'filme plastico'],
    ['papel aluminio', 'papel-aluminio'], ['papel toalha', 'papel-toalha'], ['carne de sol', 'carne seca'],
    ['sobrecoxa', 'sobrecoxa de frango'], ['coxa', 'coxa de frango'], ['tang', 'suco em po tang'], ['fralda geriatrica', 'fralda adulto'],
    ['leite ninho', 'leite em po ninho'], ['nan', 'leite infantil nan'], ['mucilon', 'cereal infantil'], ['ovo', 'ovos'],
    ['batata palha', 'batata chips'], ['tupperware', 'pote plastico'], ['racao gato', 'racao para gato'], ['racao cachorro', 'racao para cachorro'], ['racao cao', 'racao para cachorro'],
    ['sabonete dove', 'dove sabonete'], ['pampers', 'fralda pampers'], ['huggies', 'fralda huggies'], ['tintura', 'tintura de cabelo'], ['remedio', 'dipirona'],
];
