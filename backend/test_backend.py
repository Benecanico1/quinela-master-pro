from stats_engine import compute_frequency_and_delays
from pattern_engine import analyze_patterns, analyze_cross_lottery
from markov_model import compute_markov_transitions
from predictor import calculate_composite_predictions, run_backtesting

print("=== STATS & FREQUENCIES ===")
s = compute_frequency_and_delays('ciudad', 'matutina')
print("Total draws analyzed:", s['total_draws'])
print("Top 5 Hot:", [x['number'] for x in s['rankings']['hot_numbers'][:5]])
print("Top 5 Delayed:", [(x['number'], x['current_delay']) for x in s['rankings']['most_delayed'][:5]])
print("Chi2:", s['chi2_test'])

print("\n=== PATTERNS ===")
p = analyze_patterns()
print("Parity Distribution:", p['parity'])
print("High/Low Distribution:", p['high_low'])

print("\n=== MARKOV TRANSITIONS ===")
m = compute_markov_transitions()
print("Last Head Ambo:", m['last_draw_head'])
print("Next Best Endings:", m['next_ending_probabilities'][:3])

print("\n=== PREDICTOR SCORES ===")
pred = calculate_composite_predictions('all', 'all', top_k=5)
for c in pred['top_predictions']:
    print(f"Num {c['number']} ({c['significado']}): Score {c['composite_score']} | Reasons: {c['reasons']}")

print("\n=== BACKTESTING ===")
bt = run_backtesting('all', 'all', 50)
print(f"Hit Rate: {bt['head_hit_rate']}% vs Azar: {bt['baseline_head_rate']}% -> {bt['performance_lift']}")
