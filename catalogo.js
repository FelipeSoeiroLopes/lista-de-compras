'use strict';

/* ================================================
   CATÁLOGO DE ITENS COMUNS
   Alimenta as sugestões ao digitar e a escolha automática de categoria.
   Formato: [nome, categoria, unidade]
   ================================================ */
const CATALOGO = [
    // Frutas
    ['Banana', 'Frutas', 'kg'], ['Maçã', 'Frutas', 'kg'], ['Laranja', 'Frutas', 'kg'],
    ['Limão', 'Frutas', 'kg'], ['Mamão', 'Frutas', 'un'], ['Manga', 'Frutas', 'un'],
    ['Abacaxi', 'Frutas', 'un'], ['Melancia', 'Frutas', 'un'], ['Melão', 'Frutas', 'un'],
    ['Uva', 'Frutas', 'kg'], ['Morango', 'Frutas', 'cx'], ['Pera', 'Frutas', 'kg'],
    ['Abacate', 'Frutas', 'un'], ['Goiaba', 'Frutas', 'kg'], ['Maracujá', 'Frutas', 'kg'],
    ['Tangerina', 'Frutas', 'kg'], ['Coco', 'Frutas', 'un'], ['Kiwi', 'Frutas', 'un'],

    // Verduras e legumes
    ['Alface', 'Verduras', 'un'], ['Tomate', 'Verduras', 'kg'], ['Cebola', 'Verduras', 'kg'],
    ['Alho', 'Verduras', 'g'], ['Batata', 'Verduras', 'kg'], ['Batata-doce', 'Verduras', 'kg'],
    ['Cenoura', 'Verduras', 'kg'], ['Beterraba', 'Verduras', 'kg'], ['Abobrinha', 'Verduras', 'kg'],
    ['Abóbora', 'Verduras', 'kg'], ['Chuchu', 'Verduras', 'kg'], ['Pepino', 'Verduras', 'kg'],
    ['Pimentão', 'Verduras', 'kg'], ['Brócolis', 'Verduras', 'un'], ['Couve', 'Verduras', 'un'],
    ['Couve-flor', 'Verduras', 'un'], ['Repolho', 'Verduras', 'un'], ['Rúcula', 'Verduras', 'un'],
    ['Espinafre', 'Verduras', 'un'], ['Mandioca', 'Verduras', 'kg'], ['Cheiro-verde', 'Verduras', 'un'],
    ['Berinjela', 'Verduras', 'kg'], ['Vagem', 'Verduras', 'kg'], ['Quiabo', 'Verduras', 'kg'],

    // Carnes e ovos
    ['Carne moída', 'Carnes', 'kg'], ['Patinho', 'Carnes', 'kg'], ['Acém', 'Carnes', 'kg'],
    ['Alcatra', 'Carnes', 'kg'], ['Contrafilé', 'Carnes', 'kg'], ['Picanha', 'Carnes', 'kg'],
    ['Costela', 'Carnes', 'kg'], ['Peito de frango', 'Carnes', 'kg'], ['Coxa de frango', 'Carnes', 'kg'],
    ['Frango', 'Carnes', 'kg'], ['Linguiça', 'Carnes', 'kg'], ['Bacon', 'Carnes', 'g'],
    ['Carne', 'Carnes', 'kg'], ['Bisteca', 'Carnes', 'kg'], ['Pernil', 'Carnes', 'kg'],
    ['Salsicha', 'Carnes', 'kg'], ['Peixe', 'Carnes', 'kg'], ['Tilápia', 'Carnes', 'kg'],
    ['Salmão', 'Carnes', 'kg'], ['Camarão', 'Carnes', 'kg'], ['Atum', 'Mercearia', 'un'],
    ['Sardinha', 'Mercearia', 'un'], ['Ovos', 'Carnes', 'dz'],

    // Laticínios e frios
    ['Leite', 'Laticínios', 'L'], ['Leite condensado', 'Laticínios', 'un'], ['Leite em pó', 'Laticínios', 'un'],
    ['Creme de leite', 'Laticínios', 'un'], ['Iogurte', 'Laticínios', 'un'], ['Requeijão', 'Laticínios', 'un'],
    ['Queijo', 'Laticínios', 'g'], ['Queijo muçarela', 'Laticínios', 'g'], ['Queijo minas', 'Laticínios', 'g'],
    ['Queijo ralado', 'Laticínios', 'un'], ['Manteiga', 'Laticínios', 'un'], ['Margarina', 'Laticínios', 'un'],
    ['Presunto', 'Laticínios', 'g'], ['Peito de peru', 'Laticínios', 'g'], ['Mortadela', 'Laticínios', 'g'],

    // Padaria
    ['Pão francês', 'Padaria', 'un'], ['Pão de forma', 'Padaria', 'pct'], ['Pão de queijo', 'Padaria', 'pct'],
    ['Pão', 'Padaria', 'un'], ['Bisnaguinha', 'Padaria', 'pct'], ['Bolo', 'Padaria', 'un'],
    ['Torrada', 'Padaria', 'pct'], ['Sonho', 'Padaria', 'un'],

    // Bebidas
    ['Água mineral', 'Bebidas', 'L'], ['Água com gás', 'Bebidas', 'un'], ['Refrigerante', 'Bebidas', 'L'],
    ['Suco', 'Bebidas', 'L'], ['Suco de laranja', 'Bebidas', 'L'], ['Cerveja', 'Bebidas', 'un'],
    ['Vinho', 'Bebidas', 'un'], ['Energético', 'Bebidas', 'un'], ['Chá gelado', 'Bebidas', 'un'],
    ['Água de coco', 'Bebidas', 'un'], ['Isotônico', 'Bebidas', 'un'],

    // Limpeza
    ['Detergente', 'Limpeza', 'un'], ['Lava-louças', 'Limpeza', 'un'], ['Sabão em pó', 'Limpeza', 'un'],
    ['Sabão líquido', 'Limpeza', 'un'], ['Sabão em barra', 'Limpeza', 'un'], ['Amaciante', 'Limpeza', 'un'],
    ['Água sanitária', 'Limpeza', 'L'], ['Desinfetante', 'Limpeza', 'L'], ['Multiuso', 'Limpeza', 'un'],
    ['Limpa-vidros', 'Limpeza', 'un'], ['Esponja', 'Limpeza', 'pct'], ['Pano de chão', 'Limpeza', 'un'],
    ['Saco de lixo', 'Limpeza', 'pct'], ['Lustra-móveis', 'Limpeza', 'un'], ['Álcool', 'Limpeza', 'un'],
    ['Inseticida', 'Limpeza', 'un'], ['Palha de aço', 'Limpeza', 'pct'], ['Papel-toalha', 'Limpeza', 'pct'],
    ['Papel-alumínio', 'Limpeza', 'un'], ['Filme plástico', 'Limpeza', 'un'],

    // Higiene
    ['Papel higiênico', 'Higiene', 'pct'], ['Sabonete', 'Higiene', 'un'], ['Sabonete líquido', 'Higiene', 'un'],
    ['Shampoo', 'Higiene', 'un'], ['Xampu', 'Higiene', 'un'], ['Condicionador', 'Higiene', 'un'],
    ['Creme dental', 'Higiene', 'un'], ['Pasta de dente', 'Higiene', 'un'], ['Escova de dente', 'Higiene', 'un'],
    ['Fio dental', 'Higiene', 'un'], ['Enxaguante bucal', 'Higiene', 'un'], ['Desodorante', 'Higiene', 'un'],
    ['Absorvente', 'Higiene', 'pct'], ['Fralda', 'Higiene', 'pct'], ['Lenço umedecido', 'Higiene', 'pct'],
    ['Aparelho de barbear', 'Higiene', 'un'], ['Algodão', 'Higiene', 'pct'], ['Hidratante', 'Higiene', 'un'],
    ['Protetor solar', 'Higiene', 'un'],

    // Congelados
    ['Sorvete', 'Congelados', 'un'], ['Pizza congelada', 'Congelados', 'un'], ['Lasanha', 'Congelados', 'un'],
    ['Hambúrguer', 'Congelados', 'cx'], ['Nuggets', 'Congelados', 'pct'], ['Batata congelada', 'Congelados', 'pct'],
    ['Polpa de fruta', 'Congelados', 'pct'], ['Açaí', 'Congelados', 'un'], ['Gelo', 'Congelados', 'pct'],

    // Grãos
    ['Arroz', 'Grãos', 'pct'], ['Feijão', 'Grãos', 'pct'], ['Lentilha', 'Grãos', 'pct'],
    ['Grão-de-bico', 'Grãos', 'pct'], ['Ervilha', 'Grãos', 'un'], ['Milho', 'Grãos', 'un'],
    ['Aveia', 'Grãos', 'un'], ['Granola', 'Grãos', 'pct'], ['Pipoca', 'Grãos', 'pct'],
    ['Quinoa', 'Grãos', 'pct'], ['Farinha de trigo', 'Grãos', 'pct'], ['Farinha de mandioca', 'Grãos', 'pct'],
    ['Fubá', 'Grãos', 'pct'], ['Polvilho', 'Grãos', 'pct'], ['Amido de milho', 'Grãos', 'un'],

    // Temperos e molhos
    ['Sal', 'Temperos', 'un'], ['Pimenta', 'Temperos', 'un'], ['Orégano', 'Temperos', 'un'],
    ['Colorau', 'Temperos', 'un'], ['Cominho', 'Temperos', 'un'], ['Tempero pronto', 'Temperos', 'un'],
    ['Caldo de galinha', 'Temperos', 'cx'], ['Vinagre', 'Temperos', 'un'], ['Azeite', 'Temperos', 'un'],
    ['Maionese', 'Temperos', 'un'], ['Ketchup', 'Temperos', 'un'], ['Mostarda', 'Temperos', 'un'],
    ['Molho de tomate', 'Temperos', 'un'], ['Molho shoyu', 'Temperos', 'un'], ['Extrato de tomate', 'Temperos', 'un'],

    // Mercearia
    ['Açúcar', 'Mercearia', 'kg'], ['Café', 'Mercearia', 'pct'], ['Óleo', 'Mercearia', 'un'],
    ['Óleo de soja', 'Mercearia', 'un'], ['Macarrão', 'Mercearia', 'pct'], ['Macarrão instantâneo', 'Mercearia', 'un'],
    ['Biscoito', 'Mercearia', 'pct'], ['Bolacha', 'Mercearia', 'pct'], ['Chocolate', 'Mercearia', 'un'],
    ['Achocolatado', 'Mercearia', 'un'], ['Cereal', 'Mercearia', 'un'], ['Mel', 'Mercearia', 'un'],
    ['Geleia', 'Mercearia', 'un'], ['Goiabada', 'Mercearia', 'un'], ['Gelatina', 'Mercearia', 'cx'],
    ['Fermento', 'Mercearia', 'un'], ['Salgadinho', 'Mercearia', 'pct'], ['Azeitona', 'Mercearia', 'un'],
    ['Palmito', 'Mercearia', 'un'], ['Chá', 'Mercearia', 'cx'], ['Bala', 'Mercearia', 'pct'],
    ['Bala de gelatina', 'Mercearia', 'pct'], ['Goma', 'Mercearia', 'pct'], ['Pirulito', 'Mercearia', 'pct'],
    ['Chiclete', 'Mercearia', 'pct'], ['Marshmallow', 'Mercearia', 'pct'], ['Paçoca', 'Mercearia', 'pct'],
    ['Doce de leite', 'Mercearia', 'un'], ['Wafer', 'Mercearia', 'pct'], ['Pastilha', 'Mercearia', 'un'],

    // Outros
    ['Ração para cachorro', 'Outros', 'kg'], ['Ração para gato', 'Outros', 'kg'], ['Pilha', 'Outros', 'pct'],
    ['Lâmpada', 'Outros', 'un'], ['Vela', 'Outros', 'pct'], ['Carvão', 'Outros', 'pct'],
    ['Fósforo', 'Outros', 'cx'], ['Guardanapo', 'Outros', 'pct'], ['Copo descartável', 'Outros', 'pct'],
].map(([nome, categoria, unidade]) => ({ nome, categoria, unidade, chave: normalizar(nome) }));

// "Maçã " → "maca": compara sem acento nem caixa
function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
