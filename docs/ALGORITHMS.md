# DataDoctor — Algorithmic Foundations & Mathematical Logic

This document details the mathematical algorithms, statistical models, and heuristic calculations implemented natively across the **DataDoctor** backend engine.

---

## 1. Multi-Criteria Data Quality Scoring Algorithm

DataDoctor evaluates dataset health using a deterministic, transparent composite metric bounded strictly within $[0, 100]$. The score combines four orthogonal dimensions of dataset integrity:

$$\text{Overall Score} = 0.35 \times C + 0.25 \times U + 0.25 \times V + 0.15 \times K$$

Where:
- $C$: **Completeness Score** (Weight: 35%)
- $U$: **Uniqueness Score** (Weight: 25%)
- $V$: **Validity Score** (Weight: 25%)
- $K$: **Consistency Score** (Weight: 15%)

### Dimension Formulas

#### 1. Completeness ($C$)
Let $N_{\text{total}} = R \times M$ be total cells (where $R$ is rows and $M$ is columns), and $N_{\text{missing}}$ be total null cells:
$$\text{Missing Ratio } P_m = \frac{N_{\text{missing}}}{N_{\text{total}}} \times 100$$
$$C = \max\left(0, 100 - (P_m \times 2.5)\right)$$

#### 2. Uniqueness ($U$)
Let $R_{\text{dup}}$ be the number of exact duplicate tuples:
$$\text{Duplicate Ratio } P_d = \frac{R_{\text{dup}}}{R} \times 100$$
$$U = \max\left(0, 100 - (P_d \times 3.5)\right)$$

#### 3. Validity ($V$)
Quantifies the presence of statistical outliers outside $1.5 \times \text{IQR}$ fences and infinite numerical values:
$$V = \max\left(0, 100 - \sum_{\text{numeric cols}} \min\left(P_{\text{outlier}} \times 1.2, 15.0\right)\right)$$

#### 4. Consistency ($K$)
Penalizes zero-variance columns (constant values offering zero diagnostic information) and casing variants in categorical text:
$$K = \max\left(0, 100 - (8.0 \times N_{\text{constant}}) - (5.0 \times N_{\text{casing\_variants}})\right)$$

### Grade Classification
- **Excellent**: $90.0 \le \text{Score} \le 100.0$
- **Good**: $75.0 \le \text{Score} < 90.0$
- **Fair**: $50.0 \le \text{Score} < 75.0$
- **Poor**: $0.0 \le \text{Score} < 50.0$

---

## 2. Statistical Outlier Detection (Tukey IQR Method)

For any continuous numeric series $X = \{x_1, x_2, \dots, x_n\}$, quartiles are computed using linear interpolation:
- $Q_1$: 25th percentile ($P_{25}$)
- $Q_3$: 75th percentile ($P_{75}$)
- $\text{IQR} = Q_3 - Q_1$

Boundaries are defined with multiplier $k = 1.5$:
$$\text{Lower Bound} = Q_1 - (k \times \text{IQR})$$
$$\text{Upper Bound} = Q_3 + (k \times \text{IQR})$$

Any observation $x_i$ satisfying $x_i < \text{Lower Bound}$ or $x_i > \text{Upper Bound}$ is identified as a potential anomaly.

---

## 3. Pearson Bivariate Correlation Algorithm

For any pair of numerical columns $X$ and $Y$ with $n$ matched non-null observations:
$$r_{xy} = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n} (x_i - \bar{x})^2} \sqrt{\sum_{i=1}^{n} (y_i - \bar{y})^2}}$$

Where $\bar{x}$ and $\bar{y}$ represent sample means. Multicollinear relationships are flagged when $|r_{xy}| \ge 0.65$.

---

## 4. Distribution Skewness and Kurtosis

Sample Fisher-Pearson coefficient of skewness:
$$g_1 = \frac{\frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^3}{\left(\frac{1}{n} \sum_{i=1}^{n} (x_i - \bar{x})^2\right)^{3/2}}$$

- $g_1 > +1.0$: Strong positive (right-tail) skew
- $g_1 < -1.0$: Strong negative (left-tail) skew
- $-0.5 \le g_1 \le +0.5$: Approximately symmetric distribution

---

## 5. In-Memory Session History & Undo Algorithm

To provide non-destructive data cleaning:
1. `DatasetSession` initializes two distinct DataFrames: `original_df` and `working_df`.
2. Before any mutation, a deep copy of `working_df` is pushed onto `history_stack: List[Tuple[pd.DataFrame, CleaningHistoryEntry]]`.
3. Stack size is bounded at 15 items to preserve server memory.
4. On `POST /undo`, the topmost tuple is popped, `working_df` is restored, and dependent quality/statistical caches are invalidated.
5. On `POST /reset`, `working_df` is re-instantiated from `original_df.copy()`.
