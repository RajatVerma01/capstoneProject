import React, { useState, useEffect } from 'react';
import { Search, Loader2, Filter, BookOpen, Code, TrendingUp } from 'lucide-react';
import { getFAANGQuestions } from './api';

const COMPANIES = ['All', 'Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const TYPES = ['All', 'Technical', 'Behavioral', 'System Design', 'Coding'];

export default function FAANGQuestionsView({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const QUESTIONS_PER_PAGE = 5;
  
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [selectedCompany, selectedDifficulty, selectedType]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchQuery]);

  useEffect(() => {
    updateDisplayedQuestions();
  }, [filteredQuestions, page]);

  async function loadQuestions() {
    // Don't fetch if no company selected
    if (selectedCompany === 'All') {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getFAANGQuestions({
        company: selectedCompany,
        difficulty: selectedDifficulty,
        type: selectedType
      });
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }

  function filterQuestions() {
    let filtered = [...questions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.topic?.toLowerCase().includes(query)
      );
    }

    setFilteredQuestions(filtered);
    setPage(1); // Reset to first page when filters change
  }

  function updateDisplayedQuestions() {
    const startIndex = 0;
    const endIndex = page * QUESTIONS_PER_PAGE;
    const displayed = filteredQuestions.slice(startIndex, endIndex);
    setDisplayedQuestions(displayed);
    setHasMore(endIndex < filteredQuestions.length);
  }

  function handleLoadMore() {
    setLoadingMore(true);
    setTimeout(() => {
      setPage(prev => prev + 1);
      setLoadingMore(false);
    }, 300); // Small delay for smooth UX
  }

  function getDifficultyColor(difficulty) {
    switch (difficulty) {
      case 'Easy': return 'difficulty-easy';
      case 'Medium': return 'difficulty-medium';
      case 'Hard': return 'difficulty-hard';
      default: return '';
    }
  }

  return (
    <div className="faang-questions-view">
      <div className="view-header">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Back to Home
        </button>
        <h1>FAANG Interview Questions</h1>
        <p>Real interview questions from top tech companies</p>
      </div>

      <div className="questions-filters-card card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search questions by keyword or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} /> Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="filter-select"
            >
              {COMPANIES.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <TrendingUp size={16} /> Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="filter-select"
            >
              {DIFFICULTIES.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Code size={16} /> Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              {TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-summary">
          Showing {displayedQuestions.length} of {filteredQuestions.length} questions
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={48} className="spin" />
          <p>Fetching real interview questions from the internet...</p>
          <p className="loading-subtitle">This may take a few moments</p>
        </div>
      ) : selectedCompany === 'All' ? (
        <div className="no-questions card">
          <BookOpen size={48} />
          <h3>Select a Company to View Questions</h3>
          <p>Please select a specific company from the filters above to fetch real interview questions from the internet.</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="no-questions card">
          <BookOpen size={48} />
          <p>No questions found matching your filters.</p>
          <button className="btn btn-secondary" onClick={() => {
            setSelectedDifficulty('All');
            setSelectedType('All');
            setSearchQuery('');
          }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="questions-list">
            {displayedQuestions.map((question, idx) => (
              <div key={idx} className="question-card card">
                <div className="question-header">
                  <div className="question-meta">
                    <span className={`company-badge ${question.company.toLowerCase()}`}>
                      {question.company}
                    </span>
                    <span className={`difficulty-badge ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="type-badge">{question.type}</span>
                  </div>
                  {question.topic && (
                    <span className="topic-tag">{question.topic}</span>
                  )}
                </div>

                <h3 className="question-title">{question.question}</h3>

                {question.description && (
                  <p className="question-description">{question.description}</p>
                )}

                {question.hints && question.hints.length > 0 && (
                  <details className="question-hints">
                    <summary>💡 Hints ({question.hints.length})</summary>
                    <ul>
                      {question.hints.map((hint, hintIdx) => (
                        <li key={hintIdx}>{hint}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {question.approach && (
                  <details className="question-approach">
                    <summary>🎯 Approach</summary>
                    <p>{question.approach}</p>
                  </details>
                )}

                {question.timeComplexity && (
                  <div className="question-complexity">
                    <span>⏱️ Time: {question.timeComplexity}</span>
                    {question.spaceComplexity && (
                      <span>💾 Space: {question.spaceComplexity}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button 
                className="btn btn-primary btn-large load-more-btn" 
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={20} className="spin" /> Loading...
                  </>
                ) : (
                  <>
                    Load More Questions ({filteredQuestions.length - displayedQuestions.length} remaining)
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && displayedQuestions.length > 0 && (
            <div className="end-of-list">
              <p>🎉 You've reached the end of the list!</p>
              <p className="end-of-list-subtitle">
                Try adjusting filters to see more questions
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
