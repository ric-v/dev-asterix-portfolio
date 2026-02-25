import si from "systeminformation";

export interface SystemInfo {
  osName: string;
  cpuModel: string;
  memTotal: number;
  memUsed: number;
  diskTotal: number;
  diskUsed: number;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    const [os, cpu, mem, fsSize] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.fsSize()
    ]);

    // Calculate total disk size and used space from all mounted drives
    let diskTotal = 0;
    let diskUsed = 0;

    fsSize.forEach((disk) => {
      // In bytes
      diskTotal += disk.size;
      diskUsed += disk.used;
    });

    return {
      osName: `${os.distro} ${os.release}`,
      cpuModel: cpu.brand,
      memTotal: mem.total,
      memUsed: mem.active,
      diskTotal,
      diskUsed
    };
  } catch (err) {
    console.error("Error fetching system info:", err);
    return {
      osName: "Unknown OS",
      cpuModel: "Unknown CPU",
      memTotal: 0,
      memUsed: 0,
      diskTotal: 0,
      diskUsed: 0
    };
  }
}
