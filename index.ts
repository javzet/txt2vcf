import fs from "fs";
import path from "path";

function readFile(filePath: string) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (e) {
    throw new Error(`Could not read file: ${filePath}`);
  }
}

const file = readFile(path.join(__dirname, "nokia.txt"));

const data = file.split("\n");

function clearData(data: string[]) {
  let cleanedData: string[] = [];
  data.forEach((line) => {
    if (line.includes("�")) {
      if (/Tel.fono/.test(line)) {
        let fixedLine = line.replace("�", "e").trim();
        fixedLine = fixedLine.replace("general", "").trim();
        cleanedData.push(fixedLine);
      } else if (/M.vil/.test(line)) {
        let fixedLine = line.replace("�", "o").trim();
        fixedLine = fixedLine.replace("general", "").trim();
        cleanedData.push(fixedLine);
      } else {
        let fixedLine = line.replace("�", "?");
        cleanedData.push(fixedLine);
      }
    } else {
      if (line.includes("Ciudad") || line.includes("Calle")) {
        let fixedLine = line.replace("general", "").trim();
        cleanedData.push(fixedLine);
      } else {
        cleanedData.push(line);
      }
    }
  });
  return cleanedData;
}

function formatData(data: string[]) {
  const formattedData: string[] = [];

  data.forEach((line) => {
    let formattedLine = line.replace(/\r+/g, " ").trim();
    formattedLine = formattedLine.replace(/\t+/g, "");
    formattedLine = formattedLine.replace(/\s:+/g, ":");
    formattedData.push(formattedLine);
  });

  return formattedData;
}

function transformData(data: string[]) {
  const transformedData: string[][] = [];

  let contact: string[] = [];

  const condition = (data: string) =>
    data.includes("Movil") ||
    data.includes("Telefono") ||
    data.includes("Nombre") ||
    data.includes("Ciudad") ||
    data.includes("Calle") ||
    data.includes("Apellido") ||
    data.includes("Fijo particular") ||
    data.includes("Correo general");

  for (let i = 0; i < data.length; i++) {
    if (condition(data[i])) {
      contact.push(data[i]);
    } else {
      transformedData.push(contact);
      contact = [];
    }
  }

  return transformedData;
}

type tParseData = {
  movil?: string;
  telefono?: string;
  nombre?: string;
  apellido?: string;
  fijo?: string;
  correo?: string;
  ciudad?: string;
  calle?: string;
};

function parseData(data: string[][]) {
  const parsedData: tParseData[] = [];

  const filtededData = data.filter((contact) => contact.length >= 2);

  filtededData.forEach((contact) => {
    let parsedContact: tParseData = {};
    contact.forEach((field) => {
      switch (viewFieldType(field)) {
        case 1:
          parsedContact.movil = field.replace("Movil:", "").trim();
          break;
        case 2:
          parsedContact.telefono = field.replace("Telefono:", "").trim();
          break;
        case 3:
          parsedContact.nombre = field.replace("Nombre:", "").trim();
          break;
        case 4:
          parsedContact.ciudad = field.replace("Ciudad:", "").trim();
          break;
        case 5:
          parsedContact.calle = field.replace("Calle:", "").trim();
          break;
        case 6:
          parsedContact.apellido = field.replace("Apellido:", "").trim();
          break;
        case 7:
          parsedContact.fijo = field.replace("Fijo particular:", "").trim();
          break;
        case 8:
          parsedContact.correo = field.replace("Correo general:", "").trim();
          break;
      }
    });
    parsedData.push(parsedContact);
    parsedContact = {};
  });

  return parsedData;
}

function viewFieldType(data: string) {
  if (data.includes("Movil")) return 1;
  else if (data.includes("Telefono")) return 2;
  else if (data.includes("Nombre")) return 3;
  else if (data.includes("Ciudad")) return 4;
  else if (data.includes("Calle")) return 5;
  else if (data.includes("Apellido")) return 6;
  else if (data.includes("Fijo particular")) return 7;
  else if (data.includes("Correo general")) return 8;
  else return 0;
}

const parsedData = parseData(transformData(formatData(clearData(data))));

/* 
BEGIN:VCARD
VERSION:2.1
N:;Norse;;;
FN:Norse
TEL;CELL;PREF:5544980856
END:VCARD
*/

function json2vcf(data: tParseData[]) {
  let vcfData: string[] = [];

  data.forEach((contact) => {
    let vcfContact: string = "BEGIN:VCARD\n";
    vcfContact += `VERSION:2.1\n`;
    if (contact.nombre) vcfContact += `N:;${contact.nombre};;;\n`;
    if (contact.apellido) {
      vcfContact += `FN:${contact.apellido}\n`;
    } else if (contact.nombre) {
      vcfContact += `FN:${contact.nombre}\n`;
    }
    if (contact.movil) vcfContact += `TEL;CELL;PREF:${contact.movil}\n`;
    if (contact.telefono) vcfContact += `TEL;CELL;PREF:${contact.telefono}\n`;
    if (contact.fijo) vcfContact += `TEL;CELL;PREF:${contact.fijo}\n`;
    if (contact.correo) vcfContact += `EMAIL;PREF:${contact.correo}\n`;
    if (contact.calle) vcfContact += `ADR;PREF:;;${contact.calle};`;
    if (contact.ciudad) vcfContact += `${contact.ciudad};`;
    vcfContact += `END:VCARD\n`;

    vcfData.push(vcfContact);
  });

  return vcfData.join("");
}

function writeFile(data: string, path: string) {
  try {
    fs.writeFileSync(path, data);
  } catch (e) {
    throw new Error(`Could not write file: ${path}`);
  }
}

writeFile(json2vcf(parsedData), "./output.vcf");
