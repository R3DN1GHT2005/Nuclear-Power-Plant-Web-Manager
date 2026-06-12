import requests
import random
import time
import os
import math

try:
    from dotenv import load_dotenv
    load_dotenv()
except ModuleNotFoundError:
    pass

def run_simulator():
    base_url = os.getenv("BACKEND_URL")
    
    config_url = f"{base_url}/api/sensors/config"
    measurements_url = f"{base_url}/api/sensors/readings"
    reactors_url = f"{base_url}/api/reactors/active"

    api_key = os.getenv("SENSOR_API_KEY")

    if not api_key:
        print("[CRITIC] SENSOR_API_KEY lipsește din fișierul .env! Scriptul se va opri.")
        return

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-KEY": api_key
    }
    
    sensor_state = {}
    reactor_state = {}

    print("=== Simulatorul a pornit. Se conectează la server... ===")

    def fetch_active_sensors():
        while True:
            try:
                print(f"-> Cer lista de senzori de la {config_url} ...")
                response = requests.get(url=config_url, headers=headers, timeout=5)
                response.raise_for_status()

                all_sensors = response.json()
                active = [s for s in all_sensors if s.get("reactor_status", "").lower() == "activ"]

                print(f"[SUCCES] {len(all_sensors)} senzori totali, {len(active)} pe reactoare active.\n")
                return active

            except Exception as e:
                print(f"[AȘTEPTARE] Eroare: {e}")
                if 'response' in locals():
                    print(f"-> Status HTTP: {response.status_code}")
                    print(f"-> Răspuns PHP: {response.text}")
                print("Reîncerc în 5 secunde...\n")
                time.sleep(5)

    def fetch_active_reactors():
        try:
            response = requests.get(url=reactors_url, headers=headers, timeout=5)
            response.raise_for_status()
            reactors = response.json()
            print(f"[SUCCES] {len(reactors)} reactoare active găsite.\n")
            return reactors
        except Exception as e:
            print(f"[EROARE] Nu am putut prelua reactoarele active: {e}")
            return []

    def next_sensor_value(sensor: dict) -> float:
        sid = sensor["sensor_id"]
        min_val = sensor["min_val"]
        max_val = sensor["max_val"]
        interval = max_val - min_val

        if sid not in sensor_state:
            sensor_state[sid] = round(min_val + interval * random.uniform(0.4, 0.6), 2)

        current = sensor_state[sid]

        normal_delta = interval * 0.01
        delta = random.uniform(-normal_delta, normal_delta)

        if random.random() < 0.05:
            delta = random.choice([-1, 1]) * interval * random.uniform(0.10, 0.20)

        new_value = round(current + delta, 2)

        hard_min = min_val - interval * 0.20
        hard_max = max_val + interval * 0.20
        new_value = max(hard_min, min(hard_max, new_value))

        sensor_state[sid] = new_value
        return new_value

    def next_efficiency(reactor: dict) -> float:
        rid = reactor["reactor_id"]

        if rid not in reactor_state:
            current_eff = reactor.get("reactor_efficiency", 0)
            reactor_state[rid] = current_eff if current_eff > 0 else 85.0

        current = reactor_state[rid]

        trend = -0.05
        noise = random.uniform(-0.5, 0.5)

        new_eff = round(current + trend + noise, 1)
        new_eff = max(60.0, min(98.0, new_eff))

        reactor_state[rid] = new_eff
        return new_eff

    def update_efficiency(reactor_id: int, efficiency: float):
        url = f"{base_url}/api/reactors/{reactor_id}/efficiency"
        try:
            res = requests.patch(url=url, json={"efficiency": efficiency}, headers=headers, timeout=5)
            res.raise_for_status()
            print(f"[OK] Reactor #{reactor_id} -> Eficiență: {efficiency}%")
        except requests.exceptions.RequestException as e:
            print(f"[EROARE] Eficiență reactor #{reactor_id}: {e}")

    active_sensors = fetch_active_sensors()
    active_reactors = fetch_active_reactors()

    if not active_sensors and not active_reactors:
        print("[INFO] Niciun reactor activ găsit. Simulatorul așteaptă...")

    print("=== Încep simularea datelor. Apasă CTRL+C pentru a opri. ===")

    cycle = 0

    try:
        while True:
            cycle += 1

            if cycle % 6 == 0:
                print("[REFRESH] Reîncarc configurația...")
                active_sensors = fetch_active_sensors()
                active_reactors = fetch_active_reactors()

            if not active_sensors and not active_reactors:
                print("[AȘTEPTARE] Niciun reactor activ. Reîncerc în 10 secunde...")
                time.sleep(10)
                continue

            for sensor in active_sensors:
                value = next_sensor_value(sensor)

                payload = {
                    "sensor_id": sensor["sensor_id"],
                    "value": value
                }

                try:
                    res = requests.post(url=measurements_url, json=payload, headers=headers, timeout=5)
                    res.raise_for_status()
                    print(f"[OK] Senzor #{sensor['sensor_id']} ({sensor['type']}) -> {value} "
                          f"[{sensor['min_val']} - {sensor['max_val']}]")
                except requests.exceptions.RequestException as e:
                    print(f"[EROARE] Senzor #{sensor['sensor_id']}: {e}")

            for reactor in active_reactors:
                eff = next_efficiency(reactor)
                update_efficiency(reactor["reactor_id"], eff)
                reactor["reactor_efficiency"] = eff

            print(f"------ Ciclu #{cycle} complet. Următor în 10s ------\n")
            time.sleep(10)

    except KeyboardInterrupt:
        print("\nSimulator oprit manual.")

if __name__ == "__main__":
    run_simulator()