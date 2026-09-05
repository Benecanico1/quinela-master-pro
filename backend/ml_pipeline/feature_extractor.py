import math
from datetime import datetime
from typing import List, Dict, Any, Tuple
import numpy as np

def extract_features_for_draw(
    history_draws: List[Dict[str, Any]], 
    target_draw: Dict[str, Any]
) -> Tuple[np.ndarray, Dict[str, np.ndarray], List[str]]:
    """
    Extrae la matriz de características X (100 x num_features) y los vectores de etiquetas y
    para el sorteo target_draw utilizando EXCLUSIVAMENTE los draws en history_draws.
    history_draws contiene todos los sorteos anteriores (estrictamente anteriores).
    """
    total_history = len(history_draws)
    if total_history == 0:
        raise ValueError("history_draws no puede estar vacío.")

    # Target info
    target_lottery = target_draw["lottery"]
    target_shift = target_draw["shift"]
    target_date = target_draw["draw_date"]
    target_weekday = datetime.strptime(target_date, "%Y-%m-%d").weekday() # 0 = Lunes, 6 = Domingo

    # Filtro opcional por lotería para contextualización estricta
    lottery_history = [d for d in history_draws if d["lottery"] == target_lottery]
    # Si la historia por lotería es muy pequeña, caemos a toda la historia pero con feature de lotería
    active_history = lottery_history if len(lottery_history) >= 20 else history_draws
    n_active = len(active_history)

    # Última terminación previa a la cabeza
    prev_head_ambo = active_history[-1]["head_ambo"]
    prev_unit = int(prev_head_ambo[1])

    # Contenedores para cálculo de apariciones
    # Indexamos por ambo '00' a '99'
    head_indices = {f"{i:02d}": [] for i in range(100)}
    top5_counts = {f"{i:02d}": 0 for i in range(100)}
    top10_counts = {f"{i:02d}": 0 for i in range(100)}
    top20_counts = {f"{i:02d}": 0 for i in range(100)}
    shift_counts = {f"{i:02d}": 0 for i in range(100)}
    weekday_counts = {f"{i:02d}": 0 for i in range(100)}

    # Markov transition matrix para terminaciones (10 x 10)
    markov_counts = np.zeros((10, 10), dtype=int)
    unit_counts = np.zeros(10, dtype=int)
    decade_counts = np.zeros(10, dtype=int)

    # Recorrer el historial temporal estrictamente causal
    for idx, d in enumerate(active_history):
        head = d["head_ambo"]
        head_indices[head].append(idx)
        
        u = int(head[1])
        dec = int(head[0])
        unit_counts[u] += 1
        decade_counts[dec] += 1

        if idx > 0:
            prev_u = int(active_history[idx - 1]["head_ambo"][1])
            markov_counts[prev_u, u] += 1

        d_shift = d["shift"]
        d_date = d["draw_date"]
        d_weekday = datetime.strptime(d_date, "%Y-%m-%d").weekday()

        board = d["board"]
        for pos_idx, num_str in enumerate(board):
            ambo = num_str[-2:]
            if pos_idx < 5:
                top5_counts[ambo] += 1
            if pos_idx < 10:
                top10_counts[ambo] += 1
            top20_counts[ambo] += 1

            if d_shift == target_shift:
                shift_counts[ambo] += 1
            if d_weekday == target_weekday:
                weekday_counts[ambo] += 1

    # Matriz normalizada de Markov
    row_sums = markov_counts.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    markov_probs = markov_counts / row_sums

    # Feature names
    feature_names = [
        "freq_5",
        "freq_10",
        "freq_20",
        "freq_50",
        "freq_100",
        "freq_all",
        "delay_head",
        "delay_avg",
        "delay_max",
        "delay_std",
        "trend_recent_vs_all",
        "trend_10_vs_50",
        "trend_20_vs_100",
        "pos_head_freq",
        "pos_top5_freq",
        "pos_top10_freq",
        "pos_top20_freq",
        "shift_freq",
        "weekday_freq",
        "unit_freq",
        "decade_freq",
        "markov_prob"
    ]

    # Construir matriz de features para los 100 números (00..99)
    X = np.zeros((100, len(feature_names)), dtype=float)
    
    # Construir targets
    target_head_ambo = target_draw["head_ambo"]
    target_board_ambos = [n[-2:] for n in target_draw["board"]]
    target_top5_ambos = set(target_board_ambos[:5])
    target_top10_ambos = set(target_board_ambos[:10])
    target_top20_ambos = set(target_board_ambos[:20])

    y_head = np.zeros(100, dtype=int)
    y_top5 = np.zeros(100, dtype=int)
    y_top10 = np.zeros(100, dtype=int)
    y_top20 = np.zeros(100, dtype=int)

    for i in range(100):
        num = f"{i:02d}"
        d_dec = int(num[0])
        d_unit = int(num[1])
        
        apps = head_indices[num]
        count_all = len(apps)
        
        # Ventanas móviles en cabeza
        f5 = sum(1 for idx in apps if idx >= n_active - 5)
        f10 = sum(1 for idx in apps if idx >= n_active - 10)
        f20 = sum(1 for idx in apps if idx >= n_active - 20)
        f50 = sum(1 for idx in apps if idx >= n_active - 50)
        f100 = sum(1 for idx in apps if idx >= n_active - 100)
        
        # Atrasos
        if apps:
            delay = (n_active - 1) - apps[-1]
            if len(apps) > 1:
                intervals = [apps[k+1] - apps[k] for k in range(len(apps) - 1)]
                avg_delay = float(np.mean(intervals))
                max_delay = float(np.max(intervals))
                std_delay = float(np.std(intervals))
            else:
                avg_delay = float(apps[0]) if apps[0] > 0 else 1.0
                max_delay = float(apps[0])
                std_delay = 0.0
        else:
            delay = float(n_active)
            avg_delay = float(n_active)
            max_delay = float(n_active)
            std_delay = 0.0

        # Tendencias
        trend_recent = (f10 / 10.0) - (count_all / float(n_active))
        trend_10_50 = (f10 / 10.0) - (f50 / 50.0)
        trend_20_100 = (f20 / 20.0) - (f100 / 100.0)

        # Frecuencia en posiciones
        pos_head = float(count_all) / n_active
        pos_top5 = float(top5_counts[num]) / (n_active * 5)
        pos_top10 = float(top10_counts[num]) / (n_active * 10)
        pos_top20 = float(top20_counts[num]) / (n_active * 20)

        # Turno y día
        f_shift = float(shift_counts[num]) / n_active
        f_weekday = float(weekday_counts[num]) / n_active

        # Unidad y Decena
        f_unit = float(unit_counts[d_unit]) / n_active
        f_dec = float(decade_counts[d_dec]) / n_active

        # Markov
        m_prob = float(markov_probs[prev_unit, d_unit])

        X[i, :] = [
            f5, f10, f20, f50, f100, count_all,
            delay, avg_delay, max_delay, std_delay,
            trend_recent, trend_10_50, trend_20_100,
            pos_head, pos_top5, pos_top10, pos_top20,
            f_shift, f_weekday, f_unit, f_dec, m_prob
        ]

        # Targets
        if num == target_head_ambo:
            y_head[i] = 1
        if num in target_top5_ambos:
            y_top5[i] = 1
        if num in target_top10_ambos:
            y_top10[i] = 1
        if num in target_top20_ambos:
            y_top20[i] = 1

    targets = {
        "head": y_head,
        "top5": y_top5,
        "top10": y_top10,
        "top20": y_top20
    }

    return X, targets, feature_names
