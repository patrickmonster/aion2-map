import fs from "fs";
import https from "https";
import path from "path";

// 기존 AION_MAPS 데이터를 가져옵니다
const AION_MAPS = {
  World_D_A: {
    name: "World_D_A",
    displayName: "마족 (World D A)",
    isVisible: true,
    order: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 8,
    tilesCountY: 8,
  },
  World_L_A: {
    name: "World_L_A",
    displayName: "천족 (World L A)",
    order: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 8,
    tilesCountY: 8,
  },
  World_L_Starter: {
    name: "World_L_Starter",
    displayName: "천족 시작지역",
    center: [0, 0] as [number, number],
    maxZoom: 4,
    minZoom: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 5,
    tilesCountY: 5,
  },
  World_D_Starter: {
    name: "World_D_Starter",
    displayName: "마족 시작지역",
    order: 5,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 5,
    tilesCountY: 5,
  },
  Abyss_Reshanta_A: {
    name: "Abyss_Reshanta_A",
    displayName: "어비스 리샨타 A",
    order: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 4,
    tilesCountY: 4,
  },
  Abyss_Reshanta_B: {
    name: "Abyss_Reshanta_B",
    displayName: "어비스 리샨타 B",
    order: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 2,
    tilesCountY: 2,
  },
};

// 파일 다운로드 함수
const downloadFile = async (url: string, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 디렉토리가 존재하지 않으면 생성
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);

          file.on("finish", () => {
            file.close();
            console.log(`✓ 다운로드 완료: ${filePath}`);
            resolve();
          });

          file.on("error", (err) => {
            fs.unlink(filePath, () => {}); // 실패 시 파일 삭제
            reject(err);
          });
        } else {
          file.close();
          fs.unlink(filePath, () => {}); // 실패 시 파일 삭제
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(filePath, () => {}); // 실패 시 파일 삭제
        reject(err);
      });
  });
};

// 타일 URL 생성 함수 (Map.tsx의 getTileUrl과 동일한 로직)
const getTileUrl = (mapName: string, x: number, y: number): string => {
  return `https://aion2-1251707075.cos.ap-guangzhou.myqcloud.com/UI/Map/WorldMap/${mapName}/Res/${mapName}_${String(
    x
  ).padStart(2, "0")}_${String(y).padStart(2, "0")}.webp`;
};

// 단일 맵의 모든 타일 다운로드
const downloadMapTiles = async (
  mapInfo: any,
  downloadDir: string = "./downloads"
): Promise<void> => {
  console.log(
    `\n🗺️  ${mapInfo.displayName} (${mapInfo.name}) 다운로드 시작...`
  );
  console.log(
    `타일 개수: ${mapInfo.tilesCountX} x ${mapInfo.tilesCountY} = ${
      mapInfo.tilesCountX * mapInfo.tilesCountY
    }개`
  );

  const mapDir = path.join(downloadDir, mapInfo.name);
  let successCount = 0;
  let failCount = 0;

  // 모든 타일에 대해 다운로드 작업 생성
  const downloadPromises: Promise<void>[] = [];

  for (let x = 0; x < mapInfo.tilesCountX; x++) {
    for (let y = 0; y < mapInfo.tilesCountY; y++) {
      const url = getTileUrl(mapInfo.name, x, y);
      const fileName = `${mapInfo.name}_${String(x).padStart(2, "0")}_${String(
        y
      ).padStart(2, "0")}.webp`;
      const filePath = path.join(mapDir, fileName);

      // 이미 파일이 존재하면 스킵
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  스킵 (이미 존재): ${fileName}`);
        successCount++;
        continue;
      }

      const downloadPromise = downloadFile(url, filePath)
        .then(() => {
          successCount++;
        })
        .catch((err) => {
          console.error(`❌ 실패: ${fileName} - ${err.message}`);
          failCount++;
        });

      downloadPromises.push(downloadPromise);
    }
  }

  // 모든 다운로드 완료 대기 (병렬 처리)
  await Promise.all(downloadPromises);

  console.log(`\n📊 ${mapInfo.displayName} 다운로드 결과:`);
  console.log(`   ✓ 성공: ${successCount}개`);
  console.log(`   ❌ 실패: ${failCount}개`);
  console.log(`   📁 저장 위치: ${mapDir}`);
};

// 모든 맵 다운로드
export const downloadAllMaps = async (
  downloadDir: string = "./downloads"
): Promise<void> => {
  console.log("🚀 AION 2 맵 타일 다운로드를 시작합니다...");
  console.log(`📁 다운로드 디렉토리: ${path.resolve(downloadDir)}`);

  const startTime = Date.now();

  for (const [mapKey, mapInfo] of Object.entries(AION_MAPS)) {
    try {
      await downloadMapTiles(mapInfo, downloadDir);
    } catch (error) {
      console.error(`❌ ${mapInfo.displayName} 다운로드 중 오류 발생:`, error);
    }
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  console.log(`\n🎉 모든 맵 다운로드가 완료되었습니다!`);
  console.log(`⏱️  총 소요 시간: ${duration}초`);
};

// 특정 맵만 다운로드
export const downloadSpecificMap = async (
  mapName: string,
  downloadDir: string = "./downloads"
): Promise<void> => {
  const mapInfo = AION_MAPS[mapName as keyof typeof AION_MAPS];

  if (!mapInfo) {
    console.error(`❌ 존재하지 않는 맵: ${mapName}`);
    console.log(`사용 가능한 맵: ${Object.keys(AION_MAPS).join(", ")}`);
    return;
  }

  console.log(`🚀 ${mapInfo.displayName} 다운로드를 시작합니다...`);
  const startTime = Date.now();

  try {
    await downloadMapTiles(mapInfo, downloadDir);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    console.log(`\n🎉 ${mapInfo.displayName} 다운로드가 완료되었습니다!`);
    console.log(`⏱️  소요 시간: ${duration}초`);
  } catch (error) {
    console.error(`❌ ${mapInfo.displayName} 다운로드 중 오류 발생:`, error);
  }
};

// CLI에서 직접 실행할 때
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const mapName = args[1];
  const downloadDir = args[2] || "./downloads";

  if (command === "all") {
    downloadAllMaps(downloadDir);
  } else if (command === "map" && mapName) {
    downloadSpecificMap(mapName, downloadDir);
  } else {
    console.log("사용법:");
    console.log("  모든 맵 다운로드: npm run download all [다운로드_디렉토리]");
    console.log(
      "  특정 맵 다운로드: npm run download map <맵이름> [다운로드_디렉토리]"
    );
    console.log("");
    console.log("사용 가능한 맵:");
    Object.values(AION_MAPS).forEach((map) => {
      console.log(`  - ${map.name}: ${map.displayName}`);
    });
  }
}

export default {
  downloadAllMaps,
  downloadSpecificMap,
  AION_MAPS,
};
