const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * YAML 파일을 JSON 파일로 변환하는 함수
 * @param {string} yamlFilePath - 변환할 YAML 파일 경로
 * @param {string} jsonFilePath - 생성할 JSON 파일 경로 (옵션)
 */
function convertYamlToJson(yamlFilePath, jsonFilePath = null) {
  try {
    // YAML 파일이 존재하는지 확인
    if (!fs.existsSync(yamlFilePath)) {
      throw new Error(`YAML 파일을 찾을 수 없습니다: ${yamlFilePath}`);
    }

    // YAML 파일 읽기
    console.log(`YAML 파일을 읽는 중: ${yamlFilePath}`);
    const yamlContent = fs.readFileSync(yamlFilePath, "utf8");

    // YAML을 JavaScript 객체로 파싱
    console.log("YAML을 파싱하는 중...");
    const data = yaml.load(yamlContent);

    // JSON 파일 경로 설정 (제공되지 않으면 YAML 파일과 같은 경로에 .json 확장자로 생성)
    if (!jsonFilePath) {
      const dir = path.dirname(yamlFilePath);
      const baseName = path.basename(yamlFilePath, ".yaml");
      jsonFilePath = path.join(dir, `${baseName}.json`);
    }

    // markers 배열의 각 요소에서 subtype을 type으로 변경
    if (data.markers && Array.isArray(data.markers)) {
      data.markers.forEach((marker) => {
        if (marker.subtype) {
          marker.type = marker.subtype;
          delete marker.subtype;
        }
      });
    }

    // JSON 파일로 저장 (들여쓰기 2칸으로 포맷팅)
    console.log(`JSON 파일을 저장하는 중: ${jsonFilePath}`);
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8");

    console.log("✅ 변환 완료!");
    console.log(`📁 입력: ${yamlFilePath}`);
    console.log(`📁 출력: ${jsonFilePath}`);

    // 파일 크기 비교
    const yamlStats = fs.statSync(yamlFilePath);
    const jsonStats = fs.statSync(jsonFilePath);

    console.log(`📊 YAML 크기: ${(yamlStats.size / 1024).toFixed(2)} KB`);
    console.log(`📊 JSON 크기: ${(jsonStats.size / 1024).toFixed(2)} KB`);

    return jsonFilePath;
  } catch (error) {
    console.error("❌ 변환 중 오류가 발생했습니다:", error.message);
    throw error;
  }
}

// 명령줄 인수 처리
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      "사용법: node convert-yaml-to-json.js <YAML파일경로> [JSON파일경로]"
    );
    console.log("");
    console.log("예시:");
    console.log("  node convert-yaml-to-json.js World_D_A.yaml");
    console.log(
      "  node convert-yaml-to-json.js World_D_A.yaml ./output/World_D_A.json"
    );
    process.exit(1);
  }

  const yamlFilePath = args[0];
  const jsonFilePath = args[1] || null;

  try {
    convertYamlToJson(yamlFilePath, jsonFilePath);
  } catch (error) {
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { convertYamlToJson };
