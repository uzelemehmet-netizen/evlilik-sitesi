import argparse
import math
import os
import zipfile

import shapefile  # pyshp


WGS84_PRJ = (
    'GEOGCS["WGS 84",'
    'DATUM["WGS_1984",'
    'SPHEROID["WGS 84",6378137,298.257223563]],'
    'PRIMEM["Greenwich",0],'
    'UNIT["degree",0.0174532925199433],'
    'AXIS["Latitude",NORTH],'
    'AXIS["Longitude",EAST]]'
)

WEB_MERCATOR_AUX_SPHERE_PRJ = (
    'PROJCS["WGS 84 / Pseudo-Mercator",'
    'GEOGCS["WGS 84",'
    'DATUM["WGS_1984",'
    'SPHEROID["WGS 84",6378137,298.257223563]],'
    'PRIMEM["Greenwich",0],'
    'UNIT["degree",0.0174532925199433]],'
    'PROJECTION["Mercator_1SP"],'
    'PARAMETER["central_meridian",0],'
    'PARAMETER["scale_factor",1],'
    'PARAMETER["false_easting",0],'
    'PARAMETER["false_northing",0],'
    'UNIT["metre",1],'
    'AXIS["X",EAST],'
    'AXIS["Y",NORTH]]'
)


def _sanitize_float(x: str) -> float:
    # Accept commas just in case user pastes TR-formatted decimals.
    x = x.strip().replace(",", ".")
    return float(x)


def _meters_to_degree_deltas(lat_deg: float, meters: float) -> tuple[float, float]:
    # Rough conversion good enough for tiny buffers.
    dlat = meters / 111_000.0
    dlon = meters / (111_000.0 * max(0.2, math.cos(math.radians(lat_deg))))
    return dlat, dlon


def _latlon_to_web_mercator_m(lat_deg: float, lon_deg: float) -> tuple[float, float]:
    # EPSG:3857 (WGS84 / Pseudo-Mercator) transform
    # x = R * lon, y = R * ln(tan(pi/4 + lat/2))
    # Clamp latitude to WebMercator valid range.
    max_lat = 85.05112878
    lat = max(-max_lat, min(max_lat, lat_deg))
    r = 6378137.0
    x = r * math.radians(lon_deg)
    y = r * math.log(math.tan((math.pi / 4.0) + (math.radians(lat) / 2.0)))
    return x, y


def write_point_shapefile(base_path_no_ext: str, lat: float, lon: float, name: str | None) -> list[str]:
    w = shapefile.Writer(base_path_no_ext, shapeType=shapefile.POINT)
    w.field("name", "C", size=120)
    w.field("lat", "N", decimal=8)
    w.field("lon", "N", decimal=8)
    # OSS bazı akışlarda DBF içinde Latitude/Longitude alan adlarını arayabiliyor.
    w.field("LATITUDE", "N", decimal=8)
    w.field("LONGITUDE", "N", decimal=8)

    w.point(lon, lat)  # Shapefile order: x=lon, y=lat
    w.record(name or "lokasi", lat, lon, lat, lon)
    w.close()

    prj_path = base_path_no_ext + ".prj"
    with open(prj_path, "w", encoding="utf-8") as f:
        f.write(WGS84_PRJ)

    files = [
        base_path_no_ext + ".shp",
        base_path_no_ext + ".shx",
        base_path_no_ext + ".dbf",
        prj_path,
    ]

    # Optional cpg if DBF uses UTF-8
    cpg_path = base_path_no_ext + ".cpg"
    with open(cpg_path, "w", encoding="utf-8") as f:
        f.write("UTF-8")
    files.append(cpg_path)

    return files


def write_square_polygon_shapefile(
    base_path_no_ext: str,
    lat: float,
    lon: float,
    name: str | None,
    half_size_m: float,
    crs: str,
) -> list[str]:
    if crs == "3857":
        cx, cy = _latlon_to_web_mercator_m(lat, lon)
        # Square polygon around the point in meters
        p1 = (cx - half_size_m, cy - half_size_m)
        p2 = (cx + half_size_m, cy - half_size_m)
        p3 = (cx + half_size_m, cy + half_size_m)
        p4 = (cx - half_size_m, cy + half_size_m)
        prj = WEB_MERCATOR_AUX_SPHERE_PRJ
    else:
        dlat, dlon = _meters_to_degree_deltas(lat, half_size_m)
        # Square polygon around the point in degrees
        p1 = (lon - dlon, lat - dlat)
        p2 = (lon + dlon, lat - dlat)
        p3 = (lon + dlon, lat + dlat)
        p4 = (lon - dlon, lat + dlat)
        prj = WGS84_PRJ

    w = shapefile.Writer(base_path_no_ext, shapeType=shapefile.POLYGON)
    w.field("name", "C", size=120)
    w.field("lat", "N", decimal=8)
    w.field("lon", "N", decimal=8)
    w.field("LATITUDE", "N", decimal=8)
    w.field("LONGITUDE", "N", decimal=8)
    w.field("half_m", "N", decimal=2)

    w.poly([[
        p1,
        p2,
        p3,
        p4,
        p1,
    ]])
    w.record(name or "lokasi", lat, lon, lat, lon, float(half_size_m))
    w.close()

    prj_path = base_path_no_ext + ".prj"
    with open(prj_path, "w", encoding="utf-8") as f:
        f.write(prj)

    files = [
        base_path_no_ext + ".shp",
        base_path_no_ext + ".shx",
        base_path_no_ext + ".dbf",
        prj_path,
    ]

    cpg_path = base_path_no_ext + ".cpg"
    with open(cpg_path, "w", encoding="utf-8") as f:
        f.write("UTF-8")
    files.append(cpg_path)

    return files


def zip_files(zip_path: str, file_paths: list[str]) -> None:
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for fp in file_paths:
            # OSS genelde ZIP kökünde dosyaları ister; klasöre koymuyoruz.
            z.write(fp, arcname=os.path.basename(fp))


def main() -> int:
    ap = argparse.ArgumentParser(description="OSS için lokasyon SHP ZIP üretir (WGS84).")
    ap.add_argument("--lat", required=True, help="Latitude (ör: -6.37290297)")
    ap.add_argument("--lon", required=True, help="Longitude (ör: 106.73212257)")
    ap.add_argument("--name", default="lokasi", help="Kayıt adı (DBF alanı)")
    ap.add_argument(
        "--out",
        default=os.path.join("oss", "lokasi_oss.zip"),
        help="Çıkış ZIP yolu (varsayılan: oss/lokasi_oss.zip)",
    )
    ap.add_argument(
        "--mode",
        choices=["point", "polygon"],
        default="point",
        help="OSS point mi polygon mu istiyor?",
    )
    ap.add_argument(
        "--crs",
        choices=["4326", "3857"],
        default="4326",
        help="Koordinat sistemi: 4326=WGS84 lat/lon, 3857=WGS84/Pseudo-Mercator (Auxiliary Mercator).",
    )
    ap.add_argument(
        "--polygon-half-m",
        type=float,
        default=20.0,
        help="Polygon modunda merkezden yarıçap (metre). Varsayılan 20m.",
    )

    args = ap.parse_args()

    lat = _sanitize_float(args.lat)
    lon = _sanitize_float(args.lon)

    os.makedirs("oss", exist_ok=True)
    base_no_ext = os.path.join("oss", "lokasi")

    # Clean old outputs
    for ext in (".shp", ".shx", ".dbf", ".prj", ".cpg"):
        try:
            os.remove(base_no_ext + ext)
        except FileNotFoundError:
            pass

    if args.mode == "point":
        files = write_point_shapefile(base_no_ext, lat=lat, lon=lon, name=args.name)
    else:
        files = write_square_polygon_shapefile(
            base_no_ext,
            lat=lat,
            lon=lon,
            name=args.name,
            half_size_m=args.polygon_half_m,
            crs=args.crs,
        )

    zip_files(args.out, files)

    print("OK")
    print(f"Latitude:  {lat:.8f}")
    print(f"Longitude: {lon:.8f}")
    print(f"ZIP:       {os.path.abspath(args.out)}")
    if args.mode == "polygon" and args.crs == "3857":
        print("Not: Polygon EPSG:3857 (Auxiliary Mercator / Pseudo-Mercator) üretildi.")
    else:
        print("İpucu: OSS polygon isterse mode=polygon ve gerekirse --crs 3857 deneyin.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
