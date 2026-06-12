export const nomesFemininos = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana", "Laura", "Mariana", "Natália", "Olívia", "Paula", "Rafaela", "Sofia", "Thaís", "Vitória", "Yasmin"];
export const nomesMasculinos = ["Arthur", "Bruno", "Caio", "Daniel", "Eduardo", "Felipe", "Gabriel", "Henrique", "Igor", "João", "Lucas", "Matheus", "Nicolas", "Otávio", "Pedro", "Rafael", "Samuel", "Thiago", "Vinícius", "Zeca"];
export const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];

export const cargos = [
    { title: "Dev Frontend", color: "#4da8da" },
    { title: "Dev Backend", color: "#4caf50" },
    { title: "Designer UI/UX", color: "#e91e63" },
    { title: "Product Manager", color: "#ff9800" },
    { title: "Scrum Master", color: "#9c27b0" },
    { title: "QA Engineer", color: "#00bcd4" },
    { title: "Suporte", color: "#607d8b" },
    { title: "Marketing", color: "#f44336" },
    { title: "Recursos Humanos", color: "#795548" },
    { title: "Estagiário", color: "#8bc34a" }
];

export function generateIdentity() {
    const isFemale = Math.random() > 0.5;
    const nome = isFemale 
        ? nomesFemininos[Math.floor(Math.random() * nomesFemininos.length)] 
        : nomesMasculinos[Math.floor(Math.random() * nomesMasculinos.length)];
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
    
    const cargoObj = cargos[Math.floor(Math.random() * cargos.length)];
    
    return {
        name: `${nome} ${sobrenome}`,
        role: cargoObj.title,
        roleColor: cargoObj.color,
        gender: isFemale ? 'F' : 'M'
    };
}
