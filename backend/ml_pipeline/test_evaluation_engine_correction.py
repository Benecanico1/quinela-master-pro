import unittest
import sys
import os

app_dir = r"C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app"
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from backend.ml_pipeline.prospective_validation_engine import ProspectiveValidationEngine

class TestEvaluationEngineCorrection(unittest.TestCase):
    def setUp(self):
        self.engine = ProspectiveValidationEngine()
        # Strictly isolate test ledger and disable saving to production ledger
        self.engine.ledger_file = os.path.join(app_dir, "backend", "ml_pipeline", "test_mock_ledger.json")
        self.engine._save_json = lambda path, data: None
        
        # Mock a minimal prediction structure
        self.mock_pred = {
            "prediction_id": "TEST_PRED_001",
            "prediction_locked_at": "2026-09-04 18:00:00 UTC",
            "prediction_deadline": "2026-09-04 18:45:00 UTC",
            "prediction_status": "LOCKED_PRE_DRAW_VALID",
            "evaluation_status": "PENDING",
            "top_1": "20",
            "top_5": ["20", "07", "21", "83", "99"],
            "top_10": ["20", "07", "21", "83", "99", "12", "34", "56", "78", "90"],
            "top_20": [
                "20", "07", "21", "83", "99", "12", "34", "56", "78", "90",
                "11", "22", "33", "44", "55", "66", "77", "88", "00", "01"
            ]
        }
        self.engine.ledger = {"predictions": [self.mock_pred]}

    def _eval(self, board, head="0020"):
        res = self.engine.evaluate_locked_prediction(
            prediction_id="TEST_PRED_001",
            official_head=head,
            official_board=board,
            result_received_at_utc="2026-09-04 19:00:00 UTC",
            force_recalculate=True
        )
        return res["evaluation"]

    def test_1_ambo_repeated_twice_on_board(self):
        """Test 1: Ambo repeated 2x on board contributes exactly 1 to Precision, 2 to OccurrenceHits"""
        # Board where '20' appears twice (at pos 1 and pos 2), others no match
        board = ["1020", "2020"] + [f"{i:02d}95" for i in range(18)]
        ev = self._eval(board)
        
        # '20' is in top_5, unique matches = 1
        self.assertEqual(ev["unique_hits_count_top5"], 1)
        self.assertAlmostEqual(ev["precision_at_5"], 1 / 5.0)  # 20.0%, NOT 40.0%
        self.assertEqual(ev["board_occurrence_hits_top5"], 2)
        self.assertAlmostEqual(ev["board_occurrence_coverage_top5"], 2 / 20.0)

    def test_2_ambo_repeated_three_times_on_board(self):
        """Test 2: Ambo repeated 3x on board contributes exactly 1 to Precision, 3 to OccurrenceHits"""
        board = ["1020", "2020", "3020"] + [f"{i:02d}95" for i in range(17)]
        ev = self._eval(board)
        
        self.assertEqual(ev["unique_hits_count_top5"], 1)
        self.assertAlmostEqual(ev["precision_at_5"], 1 / 5.0)  # 20.0%, NOT 60.0%
        self.assertEqual(ev["board_occurrence_hits_top5"], 3)
        self.assertAlmostEqual(ev["board_occurrence_coverage_top5"], 3 / 20.0)

    def test_3_two_distinct_predictions_hit(self):
        """Test 3: Two distinct predictions hit -> Precision@5 = 2 / 5 = 40%"""
        # '20' and '99' in board, each once
        board = ["0020", "0099"] + [f"{i:02d}95" for i in range(18)]
        ev = self._eval(board)
        
        self.assertEqual(set(ev["unique_matching_predictions_top5"]), {"20", "99"})
        self.assertEqual(ev["unique_hits_count_top5"], 2)
        self.assertAlmostEqual(ev["precision_at_5"], 2 / 5.0)  # 40.0%
        self.assertEqual(ev["hit_board_at_5"], 1)

    def test_4_zero_matches(self):
        """Test 4: Zero matches -> Precision = 0%, Hit = 0, Coverage = 0%"""
        board = [f"{i:02d}95" for i in range(20)]
        ev = self._eval(board, head="0095")
        
        self.assertEqual(ev["unique_hits_count_top5"], 0)
        self.assertAlmostEqual(ev["precision_at_5"], 0.0)
        self.assertEqual(ev["hit_board_at_5"], 0)
        self.assertEqual(ev["board_occurrence_hits_top5"], 0)
        self.assertAlmostEqual(ev["board_occurrence_coverage_top5"], 0.0)

    def test_5_matches_across_top5_top10_top20(self):
        """Test 5: Coincidences properly partitioned across Top 5 / 10 / 20"""
        # '20' (in top 5), '12' (in top 10), '11' (in top 20)
        board = ["0020", "0012", "0011"] + [f"{i:02d}95" for i in range(17)]
        ev = self._eval(board)
        
        # Top 5 has only '20'
        self.assertEqual(ev["unique_hits_count_top5"], 1)
        self.assertAlmostEqual(ev["precision_at_5"], 1 / 5.0)
        self.assertEqual(ev["hit_board_at_5"], 1)

        # Top 10 has '20' and '12'
        self.assertEqual(ev["unique_hits_count_top10"], 2)
        self.assertAlmostEqual(ev["precision_at_10"], 2 / 10.0)
        self.assertEqual(ev["hit_board_at_10"], 1)

        # Top 20 has '20', '12', and '11'
        self.assertEqual(ev["unique_hits_count_top20"], 3)
        self.assertAlmostEqual(ev["precision_at_20"], 3 / 20.0)
        self.assertEqual(ev["hit_board_at_20"], 1)

    def test_6_precision_strictly_bounded_by_100_percent(self):
        """Test 6: Verify Precision@K never exceeds 100%, even if every board number matches"""
        # Board filled entirely with '20' repeated 20 times
        board = ["0020"] * 20
        ev = self._eval(board)
        
        # Unique match is only '20', so count is 1
        self.assertLessEqual(ev["precision_at_5"], 1.0)
        self.assertLessEqual(ev["precision_at_10"], 1.0)
        self.assertLessEqual(ev["precision_at_20"], 1.0)
        self.assertEqual(ev["unique_hits_count_top5"], 1)
        self.assertEqual(ev["board_occurrence_hits_top5"], 20)
        self.assertAlmostEqual(ev["board_occurrence_coverage_top5"], 1.0)

    def test_7_every_recommended_number_contributes_at_most_one_to_precision(self):
        """Test 7: Verify every recommended number contributes at most 1 hit to Precision"""
        # Board contains '20' x5, '07' x5, '21' x5, '83' x5
        board = ["0020"] * 5 + ["0007"] * 5 + ["0021"] * 5 + ["0083"] * 5
        ev = self._eval(board)
        
        # 4 unique numbers matched: '20', '07', '21', '83'
        self.assertEqual(ev["unique_hits_count_top5"], 4)
        self.assertAlmostEqual(ev["precision_at_5"], 4 / 5.0)  # 80.0%, NOT 20/5 = 400%
        self.assertLessEqual(ev["precision_at_5"], 1.0)
        self.assertEqual(ev["board_occurrence_hits_top5"], 20)

    def test_8_board_occurrence_coverage_correctly_counts_repetitions(self):
        """Test 8: Verify BoardOccurrenceCoverage correctly counts repetitions / 20"""
        # Board: '20' x 2, '99' x 1, and 17 other non-matching numbers
        board = ["0020", "1020", "0099"] + [f"{i:02d}95" for i in range(17)]
        ev = self._eval(board)
        
        self.assertEqual(ev["board_occurrence_hits_top5"], 3)
        self.assertAlmostEqual(ev["board_occurrence_coverage_top5"], 3 / 20.0)  # 15%
        # Precision@5 is 2/5 = 40%
        self.assertAlmostEqual(ev["precision_at_5"], 2 / 5.0)

if __name__ == "__main__":
    unittest.main()
